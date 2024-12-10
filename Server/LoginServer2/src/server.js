'use strict';
import express from 'express';
import signRouter from './routes/sign.js';

const app = express();
app.use(express.json());

app.use('/api/sign', signRouter);

app.set('port',  4000);

const server = app.listen(app.get('port'), function () {
    console.log(`서버가 ${(server.address()).port} 포트에서 실행 중`);
});