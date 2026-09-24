'use strict';

const fastify = require('fastify');
const fastifyStatic = require('@fastify/static');
const path = require('path');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';


// App
const fs = require('fs');
const transp = require('morphir-bsq-transpiler');


const app = fastify({ bodyLimit: 50 * 1024 * 1024 });

app.register(fastifyStatic, {
    root: path.join(__dirname, 'web'),
    prefix: '/static/'
});

function serializeErrorLike(value) {
    if(value instanceof Error) {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (ex) {
            return {};
        }
    }

    return value;
}

// Endpoints
app.get('/', (request, reply) => {
    reply.send('Hello World');
});

app.post('/insight', async function (request, reply) {
    console.log("IR:");
    const ir = JSON.stringify(request.body);

    const irFile = 'web/morphir-ir.json';
    const irPath = path.join(__dirname, irFile);

    await fs.promises.writeFile(irPath, ir);
    console.log('Wrote:', irFile);

    const fileName = 'index.html';
    return reply.sendFile(fileName);
});



app.get('/insight', (request, reply) => {
    const fileName = 'index.html';
    reply.sendFile(fileName);
});


app.get('/insight.html', (request, reply) => {
    const fileName = 'insight.html';
    reply.sendFile(fileName);
});


app.get('/insight.js', (request, reply) => {
    const fileName = 'insight.js';
    reply.sendFile(fileName);
});



app.get('/server/morphir-ir.json', (request, reply) => {
    const fileName = 'morphir-ir.json';
    reply.sendFile(fileName);
});



app.get('/assets/2020_Morphir_Logo_Icon_WHT.svg', (request, reply) => {
    const fileName = 'assets/2020_Morphir_Logo_Icon_WHT.svg';
    reply.sendFile(fileName);
});



app.post('/verify', async function (request, reply) {
    console.log("IR:");
    const ir = request.body;

    const result = await new Promise((resolve) => {
        try {
            transp.bosque_check_ir(ir, (err, data) => {
                if(err) {
                    console.log("err:");
                    console.log(err);
                    resolve(serializeErrorLike(err));
                }
                else if(data) {
                    console.log("data:");
                    console.log(data);
                    resolve(data);
                }
                else {
                    resolve('OK');
                }
            });
        } catch (ex) {
            resolve(serializeErrorLike(ex));
        }
    });

    reply.send(result);
});

app.listen({ port: PORT, host: HOST }, function (err) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(`Running on http://${HOST}:${PORT}`);
});
