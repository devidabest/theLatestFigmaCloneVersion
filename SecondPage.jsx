import React, { useEffect, useRef, useState } from 'react';
import LeftSideBar from './LeftSideBar';
import RightSideBar from './RightSideBar';
import Toolbar from './Toolbar';

export default function SecondPage() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [layers, setLayers] = useState([]);
  const [text, setText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState(null);
  const [movingLayer, setMovingLayer] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [fillColor, setFillColor] = useState('#D9D9D9');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 500;
    canvas.height = 500;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineWidth = 5;
    contextRef.current = context;
  }, []);

  useEffect(() => {
    redraw();
  }, [layers]);

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    if (isMoving) {
      // Move the selected layer
      const updatedLayers = layers.map((layer, index) =>
        index === movingLayer ? { ...layer, startPos: { x: offsetX, y: offsetY } } : layer
      );
      setLayers(updatedLayers);
      setPosition({ x: offsetX, y: offsetY });
      setMovingLayer(null);
      setIsMoving(false);
    } else if (selectedTool === 'pen') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setCurrentShape({
        tool: 'pen',
        path: [{ x: offsetX, y: offsetY }],
        strokeStyle: strokeColor,
        fillStyle: fillColor
      });
      setIsDrawing(true);
    } else if (selectedTool === 'text') {
      setTextPos({ x: offsetX, y: offsetY });
      setShowInput(true);
    } else if (selectedTool === 'square' || selectedTool === 'circle') {
      setStartPos({ x: offsetX, y: offsetY });
      setCurrentShape({
        tool: selectedTool,
        startPos: { x: offsetX, y: offsetY },
        width: 0,
        height: 0,
        strokeStyle: strokeColor,
        fillStyle: fillColor
      });
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;

    if (selectedTool === 'pen') {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
      setCurrentShape(prevShape => ({
        ...prevShape,
        path: [...prevShape.path, { x: offsetX, y: offsetY }]
      }));
    } else if (selectedTool === 'square' || selectedTool === 'circle') {
      const width = offsetX - startPos.x;
      const height = offsetY - startPos.y;
      setCurrentShape({
        ...currentShape,
        width,
        height,
      });
      redraw();
      if (selectedTool === 'square') {
        contextRef.current.strokeRect(startPos.x, startPos.y, width, height);
      } else if (selectedTool === 'circle') {
        const radius = Math.sqrt(width * width + height * height) / 2;
        contextRef.current.beginPath();
        contextRef.current.arc(startPos.x + width / 2, startPos.y + height / 2, radius, 0, 2 * Math.PI);
        contextRef.current.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      if (selectedTool === 'pen') {
        contextRef.current.closePath();
        setLayers([...layers, currentShape]);
      } else if (selectedTool === 'square' || selectedTool === 'circle') {
        setLayers([...layers, currentShape]);
        setCurrentShape(null);
      }
      setIsDrawing(false);
    }
  };

  const redraw = () => {
    const context = contextRef.current;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    layers.forEach(drawShape);
    if (currentShape) {
      drawShape(currentShape);
    }
  };

  const drawShape = (shape) => {
    const context = contextRef.current;
    const { tool, startPos, width, height, text, textPos, path, strokeStyle, fillStyle } = shape;
    context.strokeStyle = strokeStyle;
    context.fillStyle = fillStyle;
    if (tool === 'pen') {
      context.beginPath();
      context.moveTo(path[0].x, path[0].y);
      path.forEach(point => {
        context.lineTo(point.x, point.y);
      });
      context.stroke();
    } else if (tool === 'square') {
      context.strokeRect(startPos.x, startPos.y, width, height);
      context.fillRect(startPos.x, startPos.y, width, height);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(width * width + height * height) / 2;
      context.beginPath();
      context.arc(startPos.x + width / 2, startPos.y + height / 2, radius, 0, 2 * Math.PI);
      context.stroke();
      context.fill();
    } else if (tool === 'text') {
      context.fillText(text, textPos.x, textPos.y);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    const context = contextRef.current;
    context.fillText(text, textPos.x, textPos.y);
    setLayers([...layers, { tool: 'text', text, textPos, strokeStyle: strokeColor, fillStyle: fillColor }]);
    setText('');
    setShowInput(false);
    redraw();
  };

  const handleLayerSelect = (index) => {
    setCurrentShape(layers[index]);
    setPosition(layers[index].startPos);
  };

  const handleLayerDelete = (index) => {
    const updatedLayers = layers.filter((_, i) => i !== index);
    setLayers(updatedLayers);
    redraw();
  };

  const handleLayerMove = (index) => {
    setMovingLayer(index);
    setIsMoving(true);
  };

  const handlePositionChange = (axis, value) => {
    setPosition(prevPosition => ({ ...prevPosition, [axis]: value }));
    const updatedLayers = layers.map((layer, index) =>
      index === movingLayer ? { ...layer, startPos: { ...layer.startPos, [axis]: value } } : layer
    );
    setLayers(updatedLayers);
    redraw();
  };

  const handleFillChange = (color) => {
    setFillColor(color);
  };

  const handleStrokeChange = (color) => {
    setStrokeColor(color);
  };

  return (
    <div className="flex h-screen">
      <LeftSideBar
        layers={layers}
        onSelect={handleLayerSelect}
        onDelete={handleLayerDelete}
        onMove={handleLayerMove}
      />
      <div className="flex flex-grow flex-col items-center justify-center relative">
        <Toolbar setSelectedTool={setSelectedTool} />
        <canvas
          ref={canvasRef}
          width="500"
          height="500"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="border-2 border-gray-500 mt-2"
        />
        {showInput && (
          <form
            onSubmit={handleTextSubmit}
            style={{
              position: 'absolute',
              left: textPos.x + 'px',
              top: textPos.y + 'px',
              background: 'white',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleTextSubmit}
              autoFocus
              style={{ border: '1px solid black' }}
            />
          </form>
        )}
      </div>
      <RightSideBar
        position={position}
        onPositionChange={handlePositionChange}
        onFillChange={handleFillChange}
        onStrokeChange={handleStrokeChange}
      />
    </div>
  );
}
