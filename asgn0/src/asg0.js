// HelloCanvas.js (c) 2012 matsuda

var canvas;
var ctx;
function main() {
    // Retrieve <canvas> element
    canvas = document.getElementById("webgl");

    // Note: removed the rendering context for WebGL

    // Get 2D rendering context
    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.log("Failed to get the 2D rendering context");
        return;
    }
    ctx.fillStyle = "black"; // Set color to black
    ctx.fillRect(0, 0, 400, 400);

    let v1 = [2.25, 2.25];
    drawVector(v1, "red"); // Draw x-axis vector
}

function drawVector(v, color) {
    // Scale the vector coordinates by 20
    var scaledX = v[0] * 20;
    var scaledY = v[1] * 20;

    // Set the color for the vector
    ctx.strokeStyle = color;

    // Draw the vector
    ctx.beginPath();
    ctx.moveTo(200, 200); // Start at the center of the canvas (400x400 resolution)
    ctx.lineTo(200 + scaledX, 200 - scaledY); // Adjust for canvas coordinate system
    ctx.stroke();
}

function handleDrawEvent() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill the canvas background with black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 400);

    // ---- draw the first vector ---
    // Read the values of the text boxes
    const x = parseFloat(document.getElementById("xCoord").value);
    const y = parseFloat(document.getElementById("yCoord").value);

    // Create the vector v1
    const v1 = [x, y];

    // Call drawVector with v1 and color "red"
    drawVector(v1, "red");

    // ---- draw the second vector ---
    // Read the values of the text boxes
    const x2 = parseFloat(document.getElementById("xCoord2").value);
    const y2 = parseFloat(document.getElementById("yCoord2").value);

    // Create the vector v1
    const v2 = [x2, y2];

    // Call drawVector with v1 and color "red"
    drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill the canvas background with black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 400, 400);

    // ---- draw the first vector ---
    // Read the values of the text boxes
    const x1 = parseFloat(document.getElementById("xCoord").value);
    const y1 = parseFloat(document.getElementById("yCoord").value);

    // Create the vector v1
    const v1 = new Vector3([x1, y1, 0]);

    // Call drawVector with v1 and color "red"
    drawVector([x1, y1], "red");

    // ---- draw the second vector ---
    // Read the values of the text boxes
    const x2 = parseFloat(document.getElementById("xCoord2").value);
    const y2 = parseFloat(document.getElementById("yCoord2").value);

    // Create the vector v2
    const v2 = new Vector3([x2, y2, 0]);

    // Call drawVector with v2 and color "blue"
    drawVector([x2, y2], "blue");

    // ---- perform the selected operation ---
    // Read the value of the selector
    const operation = document.getElementById("operation").value;

    // Read the scalar value
    const scalar = parseFloat(document.getElementById("scalar").value);

    if (operation === "add") {
        // v3 = v1 + v2
        const v3 = new Vector3(v1.elements).add(v2);
        drawVector([v3.elements[0], v3.elements[1]], "green");
    } else if (operation === "sub") {
        // v3 = v1 - v2
        const v3 = new Vector3(v1.elements).sub(v2);
        drawVector([v3.elements[0], v3.elements[1]], "green");
    } else if (operation === "mul") {
        // v3 = v1 * scalar, v4 = v2 * scalar
        const v3 = new Vector3(v1.elements).mul(scalar);
        const v4 = new Vector3(v2.elements).mul(scalar);
        drawVector([v3.elements[0], v3.elements[1]], "green");
        drawVector([v4.elements[0], v4.elements[1]], "green");
    } else if (operation === "div") {
        // v3 = v1 / scalar, v4 = v2 / scalar
        if (scalar === 0) {
            alert("Division by zero is not allowed.");
            return;
        }
        const v3 = new Vector3(v1.elements).div(scalar);
        const v4 = new Vector3(v2.elements).div(scalar);
        drawVector([v3.elements[0], v3.elements[1]], "green");
        drawVector([v4.elements[0], v4.elements[1]], "green");
    } else if (operation === "mag") {
        // Calculate and log the magnitude of v1 and v2
        console.log("Magnitude of v1:", v1.magnitude());
        console.log("Magnitude of v2:", v2.magnitude());
    } else if (operation === "norm") {
        // Normalize v1 and v2, then draw them in green
        const v1Normalized = new Vector3(v1.elements).normalize();
        const v2Normalized = new Vector3(v2.elements).normalize();
        drawVector(
            [v1Normalized.elements[0], v1Normalized.elements[1]],
            "green"
        );
        drawVector(
            [v2Normalized.elements[0], v2Normalized.elements[1]],
            "green"
        );
    } else if (operation === "angle") {
        const angle = angleBetween(v1, v2);
        console.log(
            "Angle between v1 and v2 (degrees):",
            (angle * 180) / Math.PI
        );
    } else if (operation === "area") {
        const area = areaTriangle(v1, v2);
        console.log("Area of the triangle formed by v1 and v2:", area);
    }
}

function angleBetween(v1, v2) {
    // Calculate the dot product of v1 and v2
    const dotProduct = Vector3.dot(v1, v2);

    // Calculate the magnitudes of v1 and v2
    const magnitudeV1 = v1.magnitude();
    const magnitudeV2 = v2.magnitude();

    // Ensure neither vector has zero magnitude to avoid division by zero
    if (magnitudeV1 === 0 || magnitudeV2 === 0) {
        throw new Error(
            "Cannot calculate the angle with a zero-length vector."
        );
    }

    // Calculate the cosine of the angle
    const cosTheta = dotProduct / (magnitudeV1 * magnitudeV2);

    // Clamp the value of cosTheta to the range [-1, 1] to handle numerical precision issues
    const clampedCosTheta = Math.max(-1, Math.min(1, cosTheta));

    // Calculate and return the angle in radians
    return Math.acos(clampedCosTheta);
}

function areaTriangle(v1, v2) {
    // Calculate the cross product of v1 and v2
    const crossProduct = Vector3.cross(v1, v2);

    // Calculate the magnitude of the cross product
    const magnitudeCross = crossProduct.magnitude();

    // The area of the triangle is half the magnitude of the cross product
    return magnitudeCross / 2;
}
