// AWS Configuration
const AWS_CONFIG = {
    region: 'eu-north-1', // e.g., 'us-east-1'
    accessKeyId: 'AKIAZSEQ3E33FR6YVMPS',
    secretAccessKey: 'ta3dRBol67DY6fDvKiXQgWtW4XvA4KYwO5PB/xxe',
    bucketName: 'web-store-files'
};

// Initialize AWS SDK
AWS.config.update({
    region: AWS_CONFIG.region,
    credentials: new AWS.Credentials({
        accessKeyId: AWS_CONFIG.accessKeyId,
        secretAccessKey: AWS_CONFIG.secretAccessKey
    })
});

const s3 = new AWS.s3; 