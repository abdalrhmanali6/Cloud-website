document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.querySelector('.browse-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const filesList = document.getElementById('files-list');
    const noFiles = document.querySelector('.no-files');

    // Store uploaded files
    let uploadedFiles = [];

    // Handle browse button click
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    async function handleFiles(files) {
        // Show progress bar
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';

        try {
            for (const file of files) {
                await uploadFileToS3(file);
            }
            
            // Update UI after all files are uploaded
            progressBar.style.width = '100%';
            setTimeout(() => {
                progressContainer.style.display = 'none';
                addFilesToList(Array.from(files));
                fileInput.value = '';
            }, 500);
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files. Please try again.');
            progressContainer.style.display = 'none';
        }
    }

    async function uploadFileToS3(file) {
        const params = {
            Bucket: AWS_CONFIG.bucketName,
            Key: `uploads/${Date.now()}-${file.name}`,
            Body: file,
            ContentType: file.type
        };

        try {
            const upload = s3.upload(params);
            
            upload.on('httpUploadProgress', (progress) => {
                const percent = Math.round((progress.loaded / progress.total) * 100);
                progressBar.style.width = `${percent}%`;
            });

            const result = await upload.promise();
            console.log('File uploaded successfully:', result.Location);
            return result;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    function addFilesToList(files) {
        if (uploadedFiles.length === 0) {
            noFiles.style.display = 'none';
        }

        files.forEach(file => {
            const fileItem = createFileItem(file);
            filesList.appendChild(fileItem);
            uploadedFiles.push(file);
        });
    }

    function createFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileIcon = document.createElement('i');
        fileIcon.className = getFileIcon(file.type);

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';

        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;

        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);

        const fileActions = document.createElement('div');
        fileActions.className = 'file-actions';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'file-action-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.title = 'Download';
        downloadBtn.onclick = () => downloadFile(file);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'file-action-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = () => deleteFile(fileItem, file);

        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);
        fileActions.appendChild(downloadBtn);
        fileActions.appendChild(deleteBtn);

        fileItem.appendChild(fileIcon);
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(fileActions);

        return fileItem;
    }

    function getFileIcon(type) {
        const icons = {
            'image/': 'fas fa-file-image',
            'video/': 'fas fa-file-video',
            'audio/': 'fas fa-file-audio',
            'application/pdf': 'fas fa-file-pdf',
            'text/': 'fas fa-file-alt',
            'application/msword': 'fas fa-file-word',
            'application/vnd.ms-excel': 'fas fa-file-excel',
            'application/vnd.ms-powerpoint': 'fas fa-file-powerpoint',
            'application/zip': 'fas fa-file-archive'
        };

        for (const [prefix, icon] of Object.entries(icons)) {
            if (type.startsWith(prefix)) {
                return icon;
            }
        }

        return 'fas fa-file';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function downloadFile(file) {
        try {
            const params = {
                Bucket: AWS_CONFIG.bucketName,
                Key: `uploads/${file.name}`
            };

            const url = await s3.getSignedUrlPromise('getObject', params);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading file. Please try again.');
        }
    }

    async function deleteFile(fileItem, file) {
        try {
            const params = {
                Bucket: AWS_CONFIG.bucketName,
                Key: `uploads/${file.name}`
            };

            await s3.deleteObject(params).promise();
            fileItem.remove();
            uploadedFiles = uploadedFiles.filter(f => f !== file);
            
            if (uploadedFiles.length === 0) {
                noFiles.style.display = 'block';
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Error deleting file. Please try again.');
        }
    }
}); 