import React, { useRef, useState, useEffect } from "react";

const Whiteboard = () => {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [lineWidth, setLineWidth] = useState(5);
    const [tool, setTool] = useState("pen");
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [text, setText] = useState(""); // For text input
    const [isAddingText, setIsAddingText] = useState(false);

    const [history, setHistory] = useState([]);
    const [currentStep, setCurrentStep] = useState(-1);

    useEffect(() => {
        const initializeCanvas = () => {
            const canvas = canvasRef.current;
            canvas.width = window.innerWidth; // Use window.innerWidth for full width
            canvas.height = window.innerHeight; // Use window.innerHeight for full height
            canvas.style.border = "2px solid #000";
            const ctx = canvas.getContext("2d");
            ctx.lineCap = "round";
            ctxRef.current = ctx;
        };

        initializeCanvas();

        const handleResize = () => initializeCanvas();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const saveState = () => {
        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL();
        const newHistory = history.slice(0, currentStep + 1);
        setHistory([...newHistory, dataUrl]);
        setCurrentStep(currentStep + 1);
    };

    // Start Drawing
    const startDrawing = (e) => {
        const { offsetX, offsetY } = e.nativeEvent;
        setStartPos({ x: offsetX, y: offsetY });
        setIsDrawing(true);

        if (tool === "pen") {
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(offsetX, offsetY);
        }
    };

    // Draw or Show Shape Preview
    const draw = (e) => {
        if (!isDrawing || tool === "text") return;

        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = ctxRef.current;

        if (tool === "pen") {
            ctx.lineTo(offsetX, offsetY);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        } else if (tool === "rectangle" || tool === "circle") {
            // Clear and show shape preview
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;

            if (tool === "rectangle") {
                const width = offsetX - startPos.x;
                const height = offsetY - startPos.y;
                ctx.strokeRect(startPos.x, startPos.y, width, height);
            } else if (tool === "circle") {
                const radius = Math.sqrt(
                    Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2)
                );
                ctx.beginPath();
                ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();
            }
        }
    };

    // Stop Drawing
    const stopDrawing = (e) => {
        if (!isDrawing) return;

        const { offsetX, offsetY } = e.nativeEvent;
        const ctx = ctxRef.current;

        if (tool === "rectangle") {
            const width = offsetX - startPos.x;
            const height = offsetY - startPos.y;
            ctx.fillStyle = color;
            ctx.fillRect(startPos.x, startPos.y, width, height);
        } else if (tool === "circle") {
            const radius = Math.sqrt(
                Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2)
            );
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        }

        setIsDrawing(false);
        saveState(); // Save the current state after drawing
    };

    // Add Text
    const handleAddText = (e) => {
        if (tool === "text") {
            const { offsetX, offsetY } = e.nativeEvent;
            const ctx = ctxRef.current;
            ctx.fillStyle = color;
            ctx.font = `${lineWidth * 5}px Arial`;
            ctx.fillText(text, offsetX, offsetY);
            setIsAddingText(false);
            saveState(); // Save state after adding text
        }
    };

    // Undo Operation
    const undo = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            const ctx = ctxRef.current;
            const previousState = history[currentStep - 1];
            const img = new Image();
            img.src = previousState;
            img.onload = () => ctx.drawImage(img, 0, 0);
        }
    };
    const redo = () => {
        if (currentStep < history.length - 1) {
            setCurrentStep(currentStep + 1);
            const ctx = ctxRef.current;
            const nextState = history[currentStep + 1];
            const img = new Image();
            img.src = nextState;
            img.onload = () => ctx.drawImage(img, 0, 0); 
        }
    };

    // Clear Canvas
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]); 
        setCurrentStep(-1);
    };

    // Export as Image
    const saveCanvas = () => {
        const canvas = canvasRef.current;
        const link = document.createElement("a");
        link.download = "whiteboard.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    return (
        <div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 items-center justify-center" style={{ marginBottom: "10px" }}>
                <button onClick={() => setTool("pen")}>Pen</button>
                <button onClick={() => setTool("rectangle")}>Rectangle</button>
                <button onClick={() => setTool("circle")}>Circle</button>
                <button onClick={() => setTool("text")}>Text</button>
                <button onClick={clearCanvas}>Clear</button>
                <button onClick={saveCanvas}>Save</button>
                <button onClick={undo} disabled={currentStep <= 0}>Undo</button>
                <button onClick={redo} disabled={currentStep >= history.length - 1}>Redo</button>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ marginLeft: "10px" }}
                />
                <input
                    type="number"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(e.target.value)}
                    style={{ marginLeft: "10px", width: "50px" }}
                />
                {tool === "text" && (
                    <input
                        type="text"
                        placeholder="Enter text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        style={{ marginLeft: "10px" }}
                    />
                )}
            </div>
            <canvas
                ref={canvasRef}
                onMouseDown={tool === "text" ? handleAddText : startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{
                    cursor: tool === "pen" ? "crosshair" : "default",
                    display: "block",
                    margin: "0 auto",
                }}
            />
        </div>
    );
}
export default Whiteboard