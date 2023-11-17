const { promisify } = require('util');
const { Client } = require('whatsapp-web.js');
const mysql = require('mysql2');
const client = new Client();
const qrcode = require('qrcode-terminal');
const readline = require('readline');

let texto = '';

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '6034',
    database: 'BotDeWp',
    port: 3306
});
connection.connect(function (err) {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});
connection.query('USE BotDeWp', function (err, result) { });


async function run() {
    client.on('qr', qr => {
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log('¡Bien! WhatsApp conectado.');
    });

    await client.initialize();

    function cumprimentar() {
        const dataAtual = new Date();
        const hora = dataAtual.getHours();

        let saludo;

        if (hora >= 6 && hora < 12) {
            saludo = "Buenos días!";
        } else if (hora >= 12 && hora < 19) {
            saludo = "Buenas tardes!";
        } else {
            saludo = "Buenas noches!";
        }

        return saludo;
    };

    const delay = ms => new Promise(res => setTimeout(res, ms));
    let auxl = {};
    client.on('message', async msg => {
        if (
            msg.body.match(/(buenas noches|buenos dias|buenas tardes|hola|dia|si|informacion)/i) &&
            msg.from.endsWith('@c.us')
        ) {
            const chat = await msg.getChat();
            chat.sendStateTyping();
            await delay(3000);
            const saludo = cumprimentar();
            await client.sendMessage(msg.from, `${saludo} Bienvenido \n1. Saludo diario \n2. Consulta ciudad de registro \n3. Salir`);
            console.log(404);
        }
        else if (msg.body.match(/(1|2|3)/i) && msg.from.endsWith('@c.us')) {
            const chat = await msg.getChat();
            console.log(405);
            chat.sendStateTyping();
            await delay(3000);
            const saludo = cumprimentar();
            let eleccion = parseInt(msg.body);
            console.log(406);
            switch (eleccion) {
                case 1:
                    await client.sendMessage(msg.from, `${saludo} Es un gusto tenerte aqui,espero que disfrutes de nuestro servicio`);
                    break;
                case 2:
                    console.log("Entró al caso 2");

                    try {
                        await client.sendMessage(msg.from, `Ingrese por favor su numero de cedula para buscar información sobre la ciudad en la que se encuentra registrado/a`);
                        const respuestaUsuario = await waitForResponse();
                        const identificacion = respuestaUsuario.body;

                        const result = await promisify(connection.query).bind(connection)('SELECT * FROM clientes where Cedula = ?', [identificacion]);

                        console.log("Resultado de la consulta:", result);

                        if (result.length > 0) {
                            let persona = {
                                Cedula: result[0].Cedula,
                                Nombre: result[0].Nombre,
                                Edad: result[0].Edad,
                                Ciudad: result[0].Ciudad
                            };

                            console.log("Objeto persona:", persona);
                            const texto = `La persona identificada con número: ${persona.Cedula}, nombre: ${persona.Nombre} y ${persona.Edad} años de edad, está registrada en la ciudad de ${persona.Ciudad}`;

                            
                            await client.sendMessage(msg.from, texto);
                        } else {
                            console.log("No se encontraron resultados para la identificación proporcionada.");
                            
                            await client.sendMessage(msg.from, "No se encontraron resultados para la identificación proporcionada.");
                        }
                    } catch (error) {
                        console.error("Error en el caso 2:", error);
                        await client.sendMessage(msg.from, "Hubo un error en el caso 2.");
                    }

                    break;
                case 3:
                    await client.sendMessage(msg.from, `Salir`);
                    break;

            }
            await client.sendMessage(msg.from, '¿Hay algo más en lo que pueda ayudarte?');

        }
    });

    function waitForResponse() {
        return new Promise((resolve, reject) => {
            client.on('message', async msg => {
                if (msg.from.endsWith('@c.us')) {
                    resolve(msg);
                }
            });
        });
    };
};

run().catch(err => console.error(err));