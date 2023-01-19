const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://18.204.131.88:3000', // new live web
    'http://18.204.131.88:3001', // new live admin
    'http://18.204.131.88:3002', // new live web-chat
    'http://beemxyz.com', // web
    'https://beemxyz.com', // web
    'http://admin.beemxyz.com', // admin
    'https://admin.beemxyz.com', // admin    
    'http://192.168.1.129:3000', // admin    
    'http://192.168.1.117:3000', // web local    
    'http://192.168.1.131:3000', // web local    
    'https://e82b-136-232-118-126.in.ngrok.io', // web local    
];

const corsOptions = {
    // origin:true,
    origin: (origin:any, callback:Function) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    credentials: true,
    optionsSuccessStatus: 200
}

export default corsOptions;