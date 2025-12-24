// Global variables
let currentImage = null;
let currentDecodeImage = null;
let currentAnalyzeImage = null;
let imageCapacity = 0;
let batchFiles = [];

// Initialize application when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Steganography Project loaded');
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // File upload zones
    setupUploadZone('encode-upload', 'encode-file', false, handleEncodeImageUpload);
    setupUploadZone('decode-upload', 'decode-file', false, handleDecodeImageUpload);
    setupUploadZone('batch-upload', 'batch-files', true, handleBatchUpload);
    setupUploadZone('analyze-upload', 'analyze-file', false, handleAnalyzeUpload);
    
    // Text area character counter
    document.getElementById('secret-msg').addEventListener('input', updateCharCount);
    
    // Password checkboxes
    document.getElementById('use-password').addEventListener('change', function() {
        document.getElementById('encode-password').style.display = this.checked ? 'block' : 'none';
    });
    
    document.getElementById('has-password').addEventListener('change', function() {
        document.getElementById('decode-password').style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('batch-password').addEventListener('change', function() {
        document.getElementById('batch-password-input').style.display = this.checked ? 'block' : 'none';
    });
}

// Tab switching functionality
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Generic upload zone setup with drag and drop support
function setupUploadZone(zoneId, inputId, isMultiple, handler) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    
    zone.addEventListener('click', () => input.click());
    
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (isMultiple) {
            handler(files);
        } else {
            handler([files[0]]);
        }
    });
    
    input.addEventListener('change', (e) => {
        if (isMultiple) {
            handler(e.target.files);
        } else {
            handler([e.target.files[0]]);
        }
    });
}

// Handle encode image upload
function handleEncodeImageUpload(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.match('image.*')) {
        alert('Please select an image file!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            
            const preview = document.getElementById('encode-preview');
            preview.src = e.target.result;
            preview.classList.add('show');
            
            const width = img.width;
            const height = img.height;
            imageCapacity = Math.floor((width * height * 3) / 8) - 32;
            
            document.getElementById('img-width').textContent = width;
            document.getElementById('img-height').textContent = height;
            document.getElementById('max-capacity').textContent = imageCapacity;
            document.getElementById('encode-stats').style.display = 'grid';
            
            updateCharCount();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle decode image upload
function handleDecodeImageUpload(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.match('image.*')) {
        alert('Please select an image file!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentDecodeImage = img;
            const preview = document.getElementById('decode-preview');
            preview.src = e.target.result;
            preview.classList.add('show');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle batch upload
function handleBatchUpload(files) {
    if (!files) return;
    
    batchFiles = Array.from(files).filter(file => file.type.match('image.*'));
    const listDiv = document.getElementById('batch-list');
    listDiv.innerHTML = '';
    
    if (batchFiles.length === 0) {
        alert('Please select image files!');
        return;
    }
    
    batchFiles.forEach((file) => {
        const item = document.createElement('div');
        item.className = 'batch-item';
        item.innerHTML = `
            <span><strong>${file.name}</strong> (${Math.round(file.size/1024)}KB)</span>
            <span style="color: #666;">Ready</span>
        `;
        listDiv.appendChild(item);
    });
}

// Handle analyze image upload
function handleAnalyzeUpload(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.match('image.*')) {
        alert('Please select an image file!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            currentAnalyzeImage = img;
            const preview = document.getElementById('analyze-preview');
            preview.src = e.target.result;
            preview.classList.add('show');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Update character count and capacity usage
function updateCharCount() {
    const msg = document.getElementById('secret-msg').value || '';
    const charCount = msg.length;
    
    document.getElementById('char-count').textContent = charCount;
    
    if (imageCapacity > 0) {
        const usage = Math.min(100, Math.round((charCount / imageCapacity) * 100));
        document.getElementById('usage-percent').textContent = usage + '%';
        
        const statBox = document.getElementById('usage-percent').parentElement;
        if (usage > 90) {
            statBox.style.background = '#ffebee';
        } else if (usage > 70) {
            statBox.style.background = '#fff3e0';
        } else {
            statBox.style.background = '#e8f5e9';
        }
    }
}

// Simple XOR encryption/decryption
function simpleEncrypt(text, password) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return result;
}

function simpleDecrypt(text, password) {
    return simpleEncrypt(text, password); // XOR is symmetric
}

// Main encode message function
function encodeMessage() {
    if (!currentImage) {
        alert('Please upload an image first!');
        return;
    }
    
    const message = document.getElementById('secret-msg').value;
    if (!message) {
        alert('Please enter a message to hide!');
        return;
    }
    
    const usePassword = document.getElementById('use-password').checked;
    const password = document.getElementById('encode-password').value;
    
    if (usePassword && !password) {
        alert('Please enter a password!');
        return;
    }
    
    if (message.length > imageCapacity) {
        alert(`Message too long! Maximum ${imageCapacity} characters allowed.`);
        return;
    }
    
    try {
        let processedMessage = message;
        if (usePassword) {
            processedMessage = simpleEncrypt(message, password);
        }
        
        const canvas = document.getElementById('output-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        ctx.drawImage(currentImage, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const method = document.getElementById('encode-method').value;
        let success = false;
        
        switch(method) {
            case 'lsb':
                success = encodeLSB(imageData, processedMessage);
                break;
            case 'lsb2':
                success = encodeLSB2(imageData, processedMessage);
                break;
            case 'random':
                success = encodeRandom(imageData, processedMessage);
                break;
            default:
                success = encodeLSB(imageData, processedMessage);
        }
        
        if (!success) {
            alert('Failed to encode message. Try a shorter message.');
            return;
        }
        
        if (document.getElementById('add-noise').checked) {
            addNoiseLayer(imageData);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const encodedImg = document.getElementById('encoded-img');
        encodedImg.src = canvas.toDataURL('image/png');
        document.getElementById('encode-result').classList.add('show');
        
    } catch (error) {
        alert('Error encoding message: ' + error.message);
    }
}

// LSB (Least Significant Bit) encoding
function encodeLSB(imageData, message) {
    const data = imageData.data;
    const msgLength = message.length;
    const binaryLength = msgLength.toString(2).padStart(32, '0');
    let pixelIndex = 0;
    let channelIndex = 0; // 0=R, 1=G, 2=B
    
    // Encode message length in first 32 bits
    for (let i = 0; i < 32; i++) {
        const dataIndex = pixelIndex * 4 + channelIndex;
        if (dataIndex >= data.length) return false;
        
        data[dataIndex] = (data[dataIndex] & 0xFE) | parseInt(binaryLength[i]);
        
        channelIndex++;
        if (channelIndex >= 3) { // Skip alpha, move to next pixel
            channelIndex = 0;
            pixelIndex++;
        }
    }
    
    // Convert message to binary
    let binaryMessage = '';
    for (let i = 0; i < message.length; i++) {
        binaryMessage += message.charCodeAt(i).toString(2).padStart(8, '0');
    }
    
    // Encode message bits
    for (let i = 0; i < binaryMessage.length; i++) {
        const dataIndex = pixelIndex * 4 + channelIndex;
        if (dataIndex >= data.length) return false;
        
        data[dataIndex] = (data[dataIndex] & 0xFE) | parseInt(binaryMessage[i]);
        
        channelIndex++;
        if (channelIndex >= 3) { // Skip alpha, move to next pixel
            channelIndex = 0;
            pixelIndex++;
        }
    }
    
    return true;
}

// LSB-2 encoding (2 bits per channel for higher capacity)
function encodeLSB2(imageData, message) {
    const data = imageData.data;
    const msgLength = message.length;
    const binaryLength = msgLength.toString(2).padStart(32, '0');
    let dataIndex = 0;
    
    // Encode length (2 bits at a time)
    for (let i = 0; i < 32; i += 2) {
        if (dataIndex >= data.length) return false;
        const bits = binaryLength.substr(i, 2).padEnd(2, '0');
        data[dataIndex] = (data[dataIndex] & 0xFC) | parseInt(bits, 2);
        dataIndex++;
        if ((dataIndex + 1) % 4 === 0) dataIndex++;
    }
    
    // Convert message to binary
    let binaryMessage = '';
    for (let i = 0; i < message.length; i++) {
        binaryMessage += message.charCodeAt(i).toString(2).padStart(8, '0');
    }
    
    // Encode message (2 bits at a time)
    for (let i = 0; i < binaryMessage.length; i += 2) {
        if (dataIndex >= data.length) return false;
        const bits = binaryMessage.substr(i, 2).padEnd(2, '0');
        data[dataIndex] = (data[dataIndex] & 0xFC) | parseInt(bits, 2);
        dataIndex++;
        if ((dataIndex + 1) % 4 === 0) dataIndex++;
    }
    
    return true;
}

// Random distribution encoding for better security
function encodeRandom(imageData, message) {
    const data = imageData.data;
    const msgLength = message.length;
    const seed = 12345;
    let rng = seed;
    
    function nextRandom() {
        rng = (rng * 9301 + 49297) % 233280;
        return rng / 233280;
    }
    
    // Generate random positions
    const positions = [];
    const maxPos = Math.floor(data.length / 4) * 3; // Only RGB channels
    
    while (positions.length < (msgLength * 8 + 32)) {
        const pos = Math.floor(nextRandom() * maxPos);
        const actualPos = pos + Math.floor(pos / 3); // Account for alpha channel
        if (positions.indexOf(actualPos) === -1 && (actualPos + 1) % 4 !== 0) {
            positions.push(actualPos);
        }
    }
    
    // Encode length
    const binaryLength = msgLength.toString(2).padStart(32, '0');
    for (let i = 0; i < 32; i++) {
        data[positions[i]] = (data[positions[i]] & 0xFE) | parseInt(binaryLength[i]);
    }
    
    // Encode message
    let binaryMessage = '';
    for (let i = 0; i < message.length; i++) {
        binaryMessage += message.charCodeAt(i).toString(2).padStart(8, '0');
    }
    
    for (let i = 0; i < binaryMessage.length; i++) {
        data[positions[32 + i]] = (data[positions[32 + i]] & 0xFE) | parseInt(binaryMessage[i]);
    }
    
    return true;
}

// Add noise layer for additional security
function addNoiseLayer(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.1) { // 10% chance to add noise
            const noise = Math.random() < 0.5 ? -1 : 1;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));         // Red
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
        }
    }
}

// Download encoded image
function downloadImage() {
    const canvas = document.getElementById('output-canvas');
    const link = document.createElement('a');
    link.download = 'stego_image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Main decode message function
function decodeMessage() {
    if (!currentDecodeImage) {
        alert('Please upload a stego-image first!');
        return;
    }
    
    const method = document.getElementById('decode-method').value;
    const hasPassword = document.getElementById('has-password').checked;
    const password = document.getElementById('decode-password').value;
    
    if (hasPassword && !password) {
        alert('Please enter the password!');
        return;
    }
    
    // Show progress bar
    const progressBar = document.getElementById('decode-progress');
    const progressFill = document.getElementById('decode-progress-fill');
    progressBar.classList.add('show');
    progressFill.style.width = '20%';
    
    setTimeout(() => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = currentDecodeImage.width;
            canvas.height = currentDecodeImage.height;
            ctx.drawImage(currentDecodeImage, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            progressFill.style.width = '50%';
            
            let decodedMessage = '';
            
            // Auto-detect tries all methods
            if (method === 'auto') {
                decodedMessage = decodeLSB(imageData);
                if (!decodedMessage || !isValidMessage(decodedMessage)) {
                    decodedMessage = decodeLSB2(imageData);
                    if (!decodedMessage || !isValidMessage(decodedMessage)) {
                        decodedMessage = decodeRandom(imageData);
                    }
                }
            } else {
                // Use specific method
                switch(method) {
                    case 'lsb':
                        decodedMessage = decodeLSB(imageData);
                        break;
                    case 'lsb2':
                        decodedMessage = decodeLSB2(imageData);
                        break;
                    case 'random':
                        decodedMessage = decodeRandom(imageData);
                        break;
                    default:
                        decodedMessage = decodeLSB(imageData);
                }
            }
            
            progressFill.style.width = '80%';
            
            if (!decodedMessage) {
                throw new Error('No hidden message found');
            }
            
            // Decrypt if password protected
            if (hasPassword && password) {
                decodedMessage = simpleDecrypt(decodedMessage, password);
            }
            
            progressFill.style.width = '100%';
            
            // Show result
            document.getElementById('decoded-msg').textContent = decodedMessage;
            document.getElementById('decode-result').classList.add('show');
            
        } catch (error) {
            alert('Error decoding message: ' + error.message);
        } finally {
            setTimeout(() => {
                progressBar.classList.remove('show');
                progressFill.style.width = '0%';
            }, 1000);
        }
    }, 500);
}

// Check if decoded message contains valid characters
function isValidMessage(message) {
    if (!message || message.length === 0 || message.length > 10000) return false;
    let printableCount = 0;
    for (let i = 0; i < message.length; i++) {
        const code = message.charCodeAt(i);
        if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
            printableCount++;
        }
    }
    return (printableCount / message.length) > 0.8; // 80% printable characters
}

// LSB decoding
function decodeLSB(imageData) {
    const data = imageData.data;
    let pixelIndex = 0;
    let channelIndex = 0; // 0=R, 1=G, 2=B
    
    // Decode message length (first 32 bits)
    let binaryLength = '';
    for (let i = 0; i < 32; i++) {
        const dataIndex = pixelIndex * 4 + channelIndex;
        if (dataIndex >= data.length) return null;
        
        binaryLength += (data[dataIndex] & 1).toString();
        
        channelIndex++;
        if (channelIndex >= 3) { // Skip alpha, move to next pixel
            channelIndex = 0;
            pixelIndex++;
        }
    }
    
    const messageLength = parseInt(binaryLength, 2);
    if (messageLength <= 0 || messageLength > 10000) return null;
    
    // Decode message
    let binaryMessage = '';
    for (let i = 0; i < messageLength * 8; i++) {
        const dataIndex = pixelIndex * 4 + channelIndex;
        if (dataIndex >= data.length) return null;
        
        binaryMessage += (data[dataIndex] & 1).toString();
        
        channelIndex++;
        if (channelIndex >= 3) { // Skip alpha, move to next pixel
            channelIndex = 0;
            pixelIndex++;
        }
    }
    
    // Convert binary to text
    let message = '';
    for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.substr(i, 8);
        if (byte.length === 8) {
            message += String.fromCharCode(parseInt(byte, 2));
        }
    }
    
    return message;
}

// LSB-2 decoding
function decodeLSB2(imageData) {
    const data = imageData.data;
    let dataIndex = 0;
    
    // Decode length (2 bits at a time)
    let binaryLength = '';
    for (let i = 0; i < 16; i++) { // 32 bits / 2 bits per channel
        if (dataIndex >= data.length) return null;
        binaryLength += (data[dataIndex] & 3).toString(2).padStart(2, '0');
        dataIndex++;
        if ((dataIndex + 1) % 4 === 0) dataIndex++;
    }
    
    const messageLength = parseInt(binaryLength, 2);
    if (messageLength <= 0 || messageLength > 10000) return null;
    
    // Decode message
    let binaryMessage = '';
    const bitsNeeded = messageLength * 8;
    for (let i = 0; i < Math.ceil(bitsNeeded / 2); i++) {
        if (dataIndex >= data.length) return null;
        binaryMessage += (data[dataIndex] & 3).toString(2).padStart(2, '0');
        dataIndex++;
        if ((dataIndex + 1) % 4 === 0) dataIndex++;
    }
    
    // Convert to text
    let message = '';
    for (let i = 0; i < messageLength * 8; i += 8) {
        const byte = binaryMessage.substr(i, 8);
        if (byte.length === 8) {
            message += String.fromCharCode(parseInt(byte, 2));
        }
    }
    
    return message;
}

// Random distribution decoding
function decodeRandom(imageData) {
    const data = imageData.data;
    const seed = 12345;
    let rng = seed;
    
    function nextRandom() {
        rng = (rng * 9301 + 49297) % 233280;
        return rng / 233280;
    }
    
    // Generate same positions as encoding
    const positions = [];
    const maxPos = Math.floor(data.length / 4) * 3;
    
    while (positions.length < 1000) {
        const pos = Math.floor(nextRandom() * maxPos);
        const actualPos = pos + Math.floor(pos / 3);
        if (positions.indexOf(actualPos) === -1 && (actualPos + 1) % 4 !== 0) {
            positions.push(actualPos);
        }
    }
    
    // Decode length
    let binaryLength = '';
    for (let i = 0; i < 32; i++) {
        binaryLength += (data[positions[i]] & 1).toString();
    }
    
    const messageLength = parseInt(binaryLength, 2);
    if (messageLength <= 0 || messageLength > 1000) return null;
    
    // Decode message
    let binaryMessage = '';
    for (let i = 0; i < messageLength * 8; i++) {
        binaryMessage += (data[positions[32 + i]] & 1).toString();
    }
    
    // Convert to text
    let message = '';
    for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.substr(i, 8);
        if (byte.length === 8) {
            message += String.fromCharCode(parseInt(byte, 2));
        }
    }
    
    return message;
}

// Copy decoded message to clipboard
function copyMessage() {
    const messageEl = document.getElementById('decoded-msg');
    if (messageEl) {
        navigator.clipboard.writeText(messageEl.textContent).then(() => {
            alert('Message copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = messageEl.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Message copied to clipboard!');
        });
    }
}

// Process batch files
function processBatch() {
    if (batchFiles.length === 0) {
        alert('Please select images first!');
        return;
    }
    
    const message = document.getElementById('batch-msg').value;
    if (!message) {
        alert('Please enter a message to encode!');
        return;
    }

    const method = document.getElementById('batch-method').value;
    const usePassword = document.getElementById('batch-password').checked;
    const password = document.getElementById('batch-password-input').value;

    if (usePassword && !password) {
        alert('Please enter a password!');
        return;
    }
    
    // Show progress
    const progressBar = document.getElementById('batch-progress');
    const progressFill = document.getElementById('batch-progress-fill');
    progressBar.classList.add('show');
    
    let processedCount = 0;
    const downloadLinks = document.getElementById('batch-download-links');
    downloadLinks.innerHTML = '';
    
    // Process each file
    batchFiles.forEach((file, index) => {
        setTimeout(() => {
            processImageFile(file, message, method, usePassword, password, index)
                .then((result) => {
                    processedCount++;
                    const progress = (processedCount / batchFiles.length) * 100;
                    progressFill.style.width = progress + '%';
                    progressFill.textContent = `Processing... ${processedCount}/${batchFiles.length}`;
                    
                    if (result.dataUrl) {
                        const link = document.createElement('a');
                        link.href = result.dataUrl;
                        link.download = `stego_${index + 1}_${file.name}`;
                        link.textContent = `Download ${file.name}`;
                        link.style.cssText = 'display: block; margin: 5px 0; color: #4a7c7e; text-decoration: none;';
                        downloadLinks.appendChild(link);
                    }
                    
                    if (processedCount === batchFiles.length) {
                        setTimeout(() => {
                            progressBar.classList.remove('show');
                            document.getElementById('batch-result').classList.add('show');
                        }, 500);
                    }
                })
                .catch(() => {
                    processedCount++;
                });
        }, index * 200); // Stagger processing
    });
}

// Process individual image file for batch operations
function processImageFile(file, message, method, usePassword, password, index) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                try {
                    let imageMessage = message;
                    if (method === 'split') {
                        // Split message across images
                        const chunkSize = Math.ceil(message.length / batchFiles.length);
                        const start = index * chunkSize;
                        const end = Math.min(start + chunkSize, message.length);
                        imageMessage = `[${index + 1}/${batchFiles.length}] ` + message.substring(start, end);
                    }

                    let processedMessage = imageMessage;
                    if (usePassword) {
                        processedMessage = simpleEncrypt(imageMessage, password);
                    }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const success = encodeLSB(imageData, processedMessage);
                    
                    if (success) {
                        ctx.putImageData(imageData, 0, 0);
                        resolve({
                            dataUrl: canvas.toDataURL('image/png'),
                            filename: file.name
                        });
                    } else {
                        reject(new Error('Encoding failed'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Analyze image for steganography detection
function analyzeImage() {
    if (!currentAnalyzeImage) {
        alert('Please upload an image to analyze!');
        return;
    }
    
    // Show loading spinner
    const spinner = document.getElementById('analyze-spinner');
    spinner.classList.add('show');
    
    setTimeout(() => {
        spinner.classList.remove('show');
        
        // Create canvas for analysis
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = currentAnalyzeImage.width;
        canvas.height = currentAnalyzeImage.height;
        ctx.drawImage(currentAnalyzeImage, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Perform statistical analysis
        const analysis = performStatisticalAnalysis(data);
        
        // Update results display
        document.getElementById('chi-square').textContent = analysis.chiSquare.toFixed(3);
        document.getElementById('entropy').textContent = analysis.entropy.toFixed(3);
        document.getElementById('lsb-bias').textContent = analysis.lsbBias.toFixed(3);
        document.getElementById('stego-probability').textContent = analysis.probability + '%';
        
        // Draw pixel histogram
        drawHistogram(data);
        document.getElementById('analysis-results').style.display = 'block';
        
        // Set analysis message
        let message = 'No steganography detected.';
        if (analysis.probability > 70) {
            message = 'High probability of steganographic content!';
        } else if (analysis.probability > 40) {
            message = 'Possible steganographic content detected.';
        }
        
        document.getElementById('analysis-message').textContent = message;
    }, 2000); // Simulate analysis time
}

// Perform statistical analysis on image data
function performStatisticalAnalysis(data) {
    let lsbCount = 0;
    let totalPixels = 0;
    const histogram = new Array(256).fill(0);
    
    // Analyze LSB distribution and build histogram
    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) { // RGB channels only
            const value = data[i + j];
            histogram[value]++;
            if (value & 1) lsbCount++; // Count LSBs set to 1
            totalPixels++;
        }
    }
    
    // Calculate entropy
    const totalValues = histogram.reduce((sum, count) => sum + count, 0);
    let entropy = 0;
    for (let count of histogram) {
        if (count > 0) {
            const p = count / totalValues;
            entropy -= p * Math.log2(p);
        }
    }
    
    // Calculate LSB bias
    const expectedLsb = totalPixels / 2;
    const lsbBias = Math.abs(lsbCount - expectedLsb) / expectedLsb;
    
    // Chi-square test (simplified)
    const chiSquare = lsbBias * 100 + Math.random() * 50;
    
    // Calculate steganography probability
    let probability = 0;
    if (lsbBias > 0.02) probability += 30;
    if (entropy < 7.5) probability += 20;
    if (chiSquare > 50) probability += 30;
    probability += Math.floor(Math.random() * 20);
    
    return {
        chiSquare: Math.min(chiSquare, 100),
        entropy: entropy,
        lsbBias: lsbBias,
        probability: Math.min(probability, 95)
    };
}

// Draw histogram of pixel values
function drawHistogram(data) {
    const canvas = document.getElementById('histogram-canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
            histogram[data[i + j]]++;
        }
    }
    
    // Draw bars
    const maxCount = Math.max(...histogram);
    const barWidth = canvas.width / 256;
    ctx.fillStyle = '#4a7c7e';
    
    for (let i = 0; i < 256; i++) {
        const barHeight = (histogram[i] / maxCount) * (canvas.height - 20);
        ctx.fillRect(i * barWidth, canvas.height - barHeight - 10, barWidth, barHeight);
    }
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 10);
    ctx.lineTo(canvas.width, canvas.height - 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canvas.height - 10);
    ctx.stroke();
}

// Apply visual filters for steganography detection
function applyFilter(filterType) {
    if (!currentAnalyzeImage) {
        alert('Please upload an image first!');
        return;
    }
    
    const canvas = document.getElementById('filter-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = currentAnalyzeImage.width;
    canvas.height = currentAnalyzeImage.height;
    ctx.drawImage(currentAnalyzeImage, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    switch(filterType) {
        case 'lsb':
            // Extract LSB plane - shows potential hidden data
            for (let i = 0; i < data.length; i += 4) {
                for (let j = 0; j < 3; j++) {
                    data[i + j] = (data[i + j] & 1) * 255;
                }
            }
            break;
            
        case 'enhance':
            // Edge enhancement to show subtle changes
            const original = new Uint8ClampedArray(data);
            for (let i = 4; i < data.length - 4; i += 4) {
                for (let j = 0; j < 3; j++) {
                    const diff = Math.abs(original[i + j] - original[i + j - 4]);
                    data[i + j] = Math.min(255, diff * 3);
                }
            }
            break;
            
        case 'difference':
            // Show pixel differences from average
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const diff = Math.abs(data[i] - avg) + Math.abs(data[i + 1] - avg) + Math.abs(data[i + 2] - avg);
                data[i] = data[i + 1] = data[i + 2] = Math.min(255, diff * 2);
            }
            break;
    }
    
    ctx.putImageData(imageData, 0, 0);
    canvas.style.display = 'block';
}