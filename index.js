const express = require('express');
const bodyParser = require('body-parser');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;


const Page = fs.readFileSync('Age.html').toString();
  const upload = multer({ dest: 'uploads/' }); 
  app.use('/images', express.static('uploads'));

// Middleware для обробки JSON-даних
app.use(bodyParser.json());

// Допоміжні масиви для зберігання даних
let devices = [];
let users = [];

// Swagger конфігурація
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory API',
      version: '1.0.0',
    },
    tags: [
      {
        name: 'default',
        description: 'Загальні API',
      },
    ],
    components: {
      schemas: {
        Device: {
          type: 'object',
          properties: {
            id: {type: 'integer', description: 'ID пpистрою'},
            name: { type: 'string', description: 'Назва пристрою' },
            description: { type: 'string', description: 'Опис пристрою' },
            serialNumber: { type: 'string', description: 'Серійний номер пристрою' },
            manufacturer: { type: 'string', description: 'Виробник пристрою' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {type: 'integer', description: 'ID користувача'},
            name: { type: 'string', description: 'Ім’я користувача' },
          },
        },
      },
    },
  },
  apis: ['index.js'],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Описання Swagger для Device та User моделей та операцій


/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Отримати список пристроїв
 *     responses:
 *       200:
 *         description: Успішний запит
 *       400:
 *         description: Неправильний формат даних або відсутні обов'язкові поля
 */
app.get('/devices', (req, res) => {
  // Логіка отримання списку пристроїв
  res.json(devices);
});

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Зареєструвати новий пристрій
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Device'
 *     responses:
 *       201:
 *         description: Успішна реєстрація
 *       400:
 *         description: Неправильний формат даних або відсутні обов'язкові поля
 */
app.post('/devices', (req, res) => {
   const newDevice = req.body;
   // Перевірка на збіг імен пристроїв
   if (devices.some(device => device.name === newDevice.name)) {
    return res.status(400).json({ error: 'Пристрій з таким ім\'ям вже зареєстровано' });
   }
   newDevice.id = req.params.id;
   if (devices.some(device => device.id === newDevice.id)) {
    return res.status(400).json({ error: 'Пристрій з таким ID вже зареєстровано' });
   }
   devices.push(newDevice);
   res.json(newDevice);
   
});



// Додайте аналогічні Swagger анотації для інших операцій (редагування, видалення, отримання інформації про пристрій)
/**
 * @swagger
 * /devices/{deviceID}:
 *   get:
 *     summary: Отримати інформацію про окремий пристрій
 *     parameters:
 *       - in: path
 *         name: deviceID
 *         required: true
 *         description: ID пристрою
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Успішний запит
 */
app.get('/devices/:deviceID', (req, res) => {
  const deviceId = req.params.id;
  const device = devices.find(d => d.id === deviceId);

  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json(device);
});

/**
 * @swagger
 * /devices/{deviceID}:
 *   put:
 *     summary: Редагувати інформацію про окремий пристрій
 *     parameters:
 *       - in: path
 *         name: deviceID
 *         required: true
 *         description: ID пристрою
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Device'
 *     responses:
 *       200:
 *         description: Успішне редагування
 */
app.put('/devices/:deviceID', (req, res) => {
  const  deviceId = req.params.id;
  let updatedDevice = {...req.body};
  let index = devices.findIndex(d => d.id === deviceId);

  if (index === -1) {
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }
    // Видаляємо поля id та assigned_to з updatedDevice
  delete updatedDevice.id;

  // Зберігаємо поточні значення id та assigned_to
  updatedDevice = { ...devices[index], ...updatedDevice };

  devices[index] = updatedDevice;
  res.json(updatedDevice);
});

/**
 * @swagger
 * /devices/{deviceID}:
 *   delete:
 *     summary: Видалити пристрій
 *     parameters:
 *       - in: path
 *         name: deviceID
 *         required: true
 *         description: ID пристрою
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Успішне видалення
 *       400:
 *         description: Неправильний формат даних або відсутні обов'язкові поля
 */
app.delete('/devices/:deviceID', (req, res) => {
  const deviceId = req.params.id;
  const index = devices.findIndex(d => d.id === deviceId);

  if (index === -1) {
    return res.status(404).json({ error: 'Пристрій не знайдено' });
  }

  devices.splice(index, 1);
  res.json({ message: 'Пристрій видалено успішно!' });
});

/** 
 * @swagger
 * /devices/{id}/image:
 *   put:
 *     summary: Додавання зображення пристрою.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID пристрою
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Успішно оновлює зображення пристрою.
 *       404:
 *         description: Пристрій не знайдено.
 */
  app.put('/devices/:id/image', upload.single('image'), (req, res) => {
    var temp = devices.filter((obj) => obj.id == req.params.deviceId);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        temp[0].image_path = req.file.filename;
        res.sendStatus(200);
        res.json({ message: 'Зображення додано успішно!' });
    }
  });


  /** 
  * @swagger
  * /devices/{id}/image:
  *   get:
  *     summary: Перегляд зображення пристрою.
  *     parameters:
  *       - in: path
  *         name: id
  *         required: true
  *         description: ID пристрою
  *         schema:
  *           type: integer
  *     responses:
  *       200:
  *         description: Успішно повертає зображення пристрою.
  *       404:
  *         description: Пристрій не знайдено або у нього немає зображення.
  */  
  app.get('/devices/:id/image', (req, res) => {
    var temp = devices.filter((obj) => obj.id == req.params.deviceId);

    if (temp.length == 0) {
        res.sendStatus(404);
    } else {
        if (temp[0].image_path != null) {
            res.send(Page.replace('{%image_path}', temp[0].image_path).replace('image_mimetype'));
        } else {
            res.sendStatus(404);
        }
      }
  });


  /**
 * @swagger
 * /users:
 *   get:
 *     summary: Отримати список користувачів
 *     responses:
 *       200:
 *         description: Успішний запит
 *       400:
 *         description: Неправильний формат даних або відсутні обов'язкові поля
 */
app.get('/users', (req, res) => {
  // Логіка отримання списку пристроїв
  res.json(users);
});



  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Зареєструвати нового користувача
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       201:
   *         description: Успішна реєстрація
   *       400:
   *         description: Неправильний формат даних або відсутні обов'язкові поля
   */
  app.post('/users', (req, res) => {
     const newUser = req.body;
     // Перевірка на збіг імен пристроїв
     if (users.some(user => user.name === newUser.name)) {
      return res.status(400).json({ error: 'Користувача з таким ім\'ям вже зареєстровано' });
     }
     newUser.id = req.params.id;
     if (users.some(user => user.id === newUser.id)) {
      return res.status(400).json({ error: 'Користувача з таким ID вже зареєстровано' });
     }
     users.push(newUser);
     res.json(newUser);
     
  });


/**
 * @swagger
 * /users/{id}/devices:
 *   get:
 *     summary: Отримання пристроїв, які використовує користувач.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID користувача
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Успішно отримано пристрої, які використовує користувач.
 *       404:
 *         description: Користувач не знайдений.
 */
app.get('/users/:id/devices', (req, res) => {
  const userId = req.params.userId;

  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'Користувач не знайдений' });
  }

  const userDevices = user.devices || [];

  res.json(userDevices);
});
  

  /**
   * @swagger
   * /devices/{id}/take:
   *   post:
   *     summary: Взяття пристрою у користування.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID пристрою
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: ID користувача, який бере пристрій у користування.
   *     responses:
   *       200:
   *         description: Успішно бере пристрій у користування.
   *       404:
   *         description: Пристрій або користувач не знайдені.
   */
  app.post('/devices/:id/take', (req, res) => {
    const deviceId = req.params.deviceId;
    const userId = req.body.id;
  
    const device = devices.find(d => d.id === deviceId);
    const user = users.find(u => u.id === userId);
  
    if (!device ) {
      return res.status(404).json({ error: 'Пристрій не знайден' });
    }

    if (!user) {
      return res.status(404).json({ error: 'користувач не знайден' });
    }
  
    device.assigned_to = "використовується";
  
    // Додаємо пристрій до користувача
    if (!user.devices) {
      user.devices = [];  
    }
    user.devices.push(device);
  
    res.json({ message: 'Пристрій взято у користування!' });
  });
  

  /**
   * @swagger
   * /devices/{id}/return:
   *   post:
   *     summary: Повернення пристрою на зберігання.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         description: ID пристрою
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: integer
   *                 description: ID користувача, який повертає пристрій.
   *     responses:
   *       200:
   *         description: Успішно повертає пристрій на зберігання.
   *       404:
   *         description: Пристрій або користувач не знайдені.
   */
  app.post('/devices/:id/return', (req, res) => {
    const deviceId = req.params.deviceId;
    const userId = req.body.id;

    const device = devices.find(d => d.id === deviceId);
    const user = users.find(u => u.id === userId);

    if (!device ) {
      return res.status(404).json({ error: 'Пристрій не знайден' });
    }
    if (!user) {
      return res.status(404).json({ error: 'користувач не знайден' });
    }

    device.assigned_to = "на зберіганні"

    user.devices.splice(device, 1);
    // Логіка для повернення пристрою на зберігання
    res.json({ message: 'Пристрій повернено на зберіання!' });
  });

  


  // Послугоємо сервер на порті 3000
app.listen(port, () => {
  console.log(`Сервер запущено на http://localhost:${port}`);
});
