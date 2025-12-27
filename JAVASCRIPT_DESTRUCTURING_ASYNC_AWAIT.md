# 📚 GIẢI THÍCH CÚ PHÁP JAVASCRIPT: DESTRUCTURING & ASYNC/AWAIT

## 📑 MỤC LỤC
1. [Destructuring Assignment](#1-destructuring-assignment)
2. [Static Methods](#2-static-methods)
3. [Async/Await](#3-asyncawait)
4. [Kết hợp tất cả](#4-kết-hợp-tất-cả)

---

## 1. DESTRUCTURING ASSIGNMENT

### Khái niệm

**Destructuring** = "Bóc tách" (lấy ra) các thuộc tính từ object/array.

### Ví dụ truyền thống (KHÔNG dùng destructuring)

```javascript
// Cách CŨ (trước ES6)
const busData = {
  bus_number: 'B01',
  license_plate: '30A-12345',
  status: 'active',
  capacity: 50
};

// Lấy từng thuộc tính
const bus_number = busData.bus_number;           // 'B01'
const license_plate = busData.license_plate;     // '30A-12345'
const status = busData.status;                   // 'active'

console.log(bus_number);      // 'B01'
console.log(license_plate);   // '30A-12345'
```

**Vấn đề:** Phải viết `busData.` nhiều lần, dài dòng!

---

### Destructuring (Cách MỚI - ES6+)

```javascript
const busData = {
  bus_number: 'B01',
  license_plate: '30A-12345',
  status: 'active',
  capacity: 50
};

// ✅ Destructuring - Lấy nhiều thuộc tính cùng lúc
const { bus_number, license_plate } = busData;

console.log(bus_number);      // 'B01'
console.log(license_plate);   // '30A-12345'
```

**Giải thích:**
```javascript
const { bus_number, license_plate } = busData;
//     └────────┬────────┘           └───┬───┘
//        Tên biến mới              Object nguồn
//    (Lấy từ object busData)
```

### So sánh trực quan

```javascript
// ❌ CÁCH CŨ (Dài dòng)
const bus_number = busData.bus_number;
const license_plate = busData.license_plate;
const status = busData.status;

// ✅ CÁCH MỚI (Ngắn gọn)
const { bus_number, license_plate, status } = busData;
```

---

### Ví dụ trong dự án của bạn

```javascript
// File: services/busService.js

static async createBus(busData) {
  // busData = { bus_number: 'B01', license_plate: '30A-12345', status: 'active' }
  
  // ❌ KHÔNG dùng destructuring
  if (!busData.bus_number || !busData.license_plate) {
    throw new Error('Thiếu thông tin');
  }
  const number = busData.bus_number;
  const plate = busData.license_plate;
  
  // ✅ DÙNG destructuring (Ngắn gọn hơn)
  const { bus_number, license_plate } = busData;
  if (!bus_number || !license_plate) {
    throw new Error('Thiếu thông tin');
  }
}
```

---

### Các trường hợp destructuring

#### A. Lấy một số thuộc tính

```javascript
const busData = {
  bus_number: 'B01',
  license_plate: '30A-12345',
  status: 'active',
  capacity: 50,
  driver_id: 5
};

// Chỉ lấy bus_number và license_plate
const { bus_number, license_plate } = busData;

console.log(bus_number);      // 'B01'
console.log(license_plate);   // '30A-12345'
// Các thuộc tính khác (status, capacity, driver_id) vẫn trong busData
```

#### B. Đặt tên mới cho biến

```javascript
const busData = {
  bus_number: 'B01',
  license_plate: '30A-12345'
};

// Lấy bus_number nhưng đặt tên mới là 'number'
const { bus_number: number, license_plate: plate } = busData;

console.log(number);  // 'B01' (KHÔNG phải bus_number)
console.log(plate);   // '30A-12345'
```

#### C. Giá trị mặc định

```javascript
const busData = {
  bus_number: 'B01',
  license_plate: '30A-12345'
  // Không có status
};

// Nếu status không có, dùng giá trị mặc định 'active'
const { bus_number, license_plate, status = 'active' } = busData;

console.log(status);  // 'active' (giá trị mặc định)
```

**Trong code của bạn:**
```javascript
// models/Bus.js
static async create(busData) {
  const { bus_number, license_plate, status = 'active' } = busData;
  //                                   └────┬────┘
  //                           Nếu không có status, dùng 'active'
}
```

#### D. Destructuring với function parameters

```javascript
// ❌ KHÔNG dùng destructuring
function createBus(busData) {
  const bus_number = busData.bus_number;
  const license_plate = busData.license_plate;
  // ...
}

// ✅ DÙNG destructuring ngay trong tham số
function createBus({ bus_number, license_plate, status = 'active' }) {
  // Đã có bus_number, license_plate, status luôn!
  console.log(bus_number);
  console.log(license_plate);
  console.log(status);
}

// Gọi hàm
createBus({ bus_number: 'B01', license_plate: '30A-12345' });
```

---

### Destructuring Array

```javascript
// Array destructuring (khác với object)
const colors = ['red', 'green', 'blue'];

// ❌ Cách cũ
const first = colors[0];
const second = colors[1];

// ✅ Destructuring
const [first, second, third] = colors;
console.log(first);   // 'red'
console.log(second);  // 'green'
console.log(third);   // 'blue'

// Ví dụ trong database query
const [rows] = await pool.execute('SELECT * FROM buses');
//     └─┬─┘
// Lấy phần tử đầu tiên của mảng kết quả
```

**Trong dự án của bạn:**
```javascript
// models/Bus.js
const [rows] = await pool.execute('SELECT * FROM buses WHERE id = ?', [id]);
//     └─┬─┘
// pool.execute trả về: [rows, fields]
// Destructuring lấy chỉ rows, bỏ qua fields
```

---

## 2. STATIC METHODS

### Khái niệm

**Static method** = Phương thức thuộc về **Class**, KHÔNG thuộc về **instance** (đối tượng).

### So sánh: Static vs Non-static

```javascript
class Car {
  // ❌ NON-STATIC method (thuộc instance)
  drive() {
    console.log('Car is driving');
  }
  
  // ✅ STATIC method (thuộc class)
  static createCar(name) {
    console.log('Creating car:', name);
    return new Car();
  }
}

// CÁCH DÙNG:

// Non-static: Phải tạo instance trước
const myCar = new Car();
myCar.drive();  // ✅ OK
Car.drive();    // ❌ ERROR - drive() không phải static

// Static: Gọi trực tiếp từ class
Car.createCar('Toyota');  // ✅ OK
myCar.createCar('Toyota'); // ❌ ERROR - createCar() là static
```

---

### Tại sao dùng Static trong dự án của bạn?

```javascript
// models/Bus.js

class BusModel {
  // ✅ Static methods - Không cần tạo instance
  static async findAll() { ... }
  static async findById(id) { ... }
  static async create(busData) { ... }
}

// CÁCH DÙNG:

// ✅ GỌI TRỰC TIẾP từ class
const buses = await BusModel.findAll();
const bus = await BusModel.findById(1);
const newBus = await BusModel.create({ ... });

// ❌ KHÔNG CẦN tạo instance
const model = new BusModel();  // ❌ Không cần!
const buses = await model.findAll();  // ❌ Phức tạp không cần thiết
```

**Lý do dùng static:**
- ✅ Ngắn gọn: `BusModel.findAll()` thay vì `new BusModel().findAll()`
- ✅ Rõ ràng: Các method này là utility functions, không cần state
- ✅ Performance: Không tốn memory tạo instance

---

### Ví dụ thực tế

```javascript
// ❌ KHÔNG dùng static (phức tạp)
class BusModel {
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM buses');
    return rows;
  }
}

// Sử dụng
const model = new BusModel();  // Phải tạo instance
const buses = await model.findAll();  // Mới gọi được


// ✅ DÙNG static (đơn giản)
class BusModel {
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM buses');
    return rows;
  }
}

// Sử dụng
const buses = await BusModel.findAll();  // Gọi trực tiếp!
```

---

## 3. ASYNC/AWAIT

### Khái niệm

**async/await** = Cú pháp để xử lý **bất đồng bộ** (asynchronous) trong JavaScript.

### Tại sao cần async/await?

Trong Node.js, các thao tác như:
- Database queries (SELECT, INSERT, UPDATE)
- File I/O (đọc/ghi file)
- HTTP requests
- setTimeout/setInterval

đều là **bất đồng bộ** (không chạy ngay lập tức, mất thời gian).

---

### Ví dụ đơn giản

#### A. Đồng bộ (Synchronous) - Chạy tuần tự

```javascript
console.log('1. Bắt đầu');
console.log('2. Xử lý');
console.log('3. Kết thúc');

// KẾT QUẢ:
// 1. Bắt đầu
// 2. Xử lý
// 3. Kết thúc
```

#### B. Bất đồng bộ (Asynchronous) - Không chờ đợi

```javascript
console.log('1. Bắt đầu');

setTimeout(() => {
  console.log('2. Xử lý (sau 2 giây)');
}, 2000);

console.log('3. Kết thúc');

// KẾT QUẢ:
// 1. Bắt đầu
// 3. Kết thúc  ← Chạy trước!
// 2. Xử lý (sau 2 giây)  ← Chạy sau!
```

---

### Promise (Trước async/await)

```javascript
// ❌ CÁCH CŨ: Dùng Promise với .then()

function getBuses() {
  pool.execute('SELECT * FROM buses')
    .then(([rows]) => {
      console.log('Buses:', rows);
      return rows;
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

// Vấn đề: Callback hell (lồng nhau nhiều tầng)
getBuses()
  .then((buses) => {
    return getDrivers();
  })
  .then((drivers) => {
    return getRoutes();
  })
  .then((routes) => {
    // ...
  })
  .catch((error) => {
    // ...
  });
```

---

### Async/Await (Cách MỚI - ES2017+)

```javascript
// ✅ CÁCH MỚI: Dùng async/await

async function getBuses() {
  try {
    const [rows] = await pool.execute('SELECT * FROM buses');
    console.log('Buses:', rows);
    return rows;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Gọi nhiều functions tuần tự
async function getAllData() {
  const buses = await getBuses();
  const drivers = await getDrivers();
  const routes = await getRoutes();
  
  console.log(buses, drivers, routes);
}
```

**Ưu điểm:**
- ✅ Dễ đọc hơn (giống code đồng bộ)
- ✅ Dễ debug hơn
- ✅ Try/catch đơn giản hơn

---

### Cú pháp chi tiết

#### A. `async` keyword

```javascript
// Hàm BÌNH THƯỜNG
function getNormalData() {
  return 'data';
}

// Hàm ASYNC - Luôn trả về Promise
async function getAsyncData() {
  return 'data';  // Tự động wrap trong Promise
}

// CÁCH DÙNG:
const data1 = getNormalData();  // 'data' (string)
const data2 = getAsyncData();   // Promise { 'data' }

// Để lấy giá trị từ async function:
const data3 = await getAsyncData();  // 'data' (string)
```

#### B. `await` keyword

```javascript
// ❌ KHÔNG dùng await - Nhận Promise
async function example1() {
  const result = pool.execute('SELECT * FROM buses');
  console.log(result);  // Promise { <pending> }
}

// ✅ DÙNG await - Nhận giá trị thực
async function example2() {
  const result = await pool.execute('SELECT * FROM buses');
  console.log(result);  // [rows, fields]
}
```

**QUY TẮC:**
- `await` CHỈ dùng được trong `async` function
- `await` đợi Promise hoàn thành, trả về giá trị

---

### Trong dự án của bạn

```javascript
// models/Bus.js

class BusModel {
  // ✅ async function - Có thể dùng await
  static async findById(id) {
    //     └─┬─┘
    //   async keyword
    
    // ✅ await - Đợi database query hoàn thành
    const [rows] = await pool.execute('SELECT * FROM buses WHERE id = ?', [id]);
    //             └─┬─┘
    //          await keyword
    //      (Đợi query xong mới chạy tiếp)
    
    return rows[0] || null;
  }
  
  static async create(busData) {
    // await #1 - Đợi INSERT xong
    const [result] = await pool.execute(
      'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
      [busData.bus_number, busData.license_plate, busData.status]
    );
    
    // await #2 - Đợi SELECT xong
    const newBus = await this.findById(result.insertId);
    //             └─┬─┘
    //         this.findById() cũng là async function
    //         nên cần await
    
    return newBus;
  }
}
```

---

### Tại sao cần await mỗi lần gọi BusModel?

```javascript
// services/busService.js

static async createBus(busData) {
  // ❌ KHÔNG await - Nhận Promise
  const existingBus = BusModel.findByLicensePlate(license_plate);
  console.log(existingBus);  // Promise { <pending> }
  if (existingBus) { ... }   // ❌ SAI! existingBus luôn truthy (là Promise)
  
  // ✅ DÙNG await - Nhận giá trị thực
  const existingBus = await BusModel.findByLicensePlate(license_plate);
  console.log(existingBus);  // { id: 1, bus_number: 'B01', ... } hoặc null
  if (existingBus) { ... }   // ✅ ĐÚNG! Kiểm tra có xe bus không
}
```

**Giải thích:**
- `BusModel.findByLicensePlate()` là **async function**
- Async function luôn trả về **Promise**
- Dùng `await` để "bóc" giá trị ra khỏi Promise

---

### Luồng xử lý với await

```javascript
// Không có await (Chạy ngay, không đợi)
console.log('1. Start');
pool.execute('SELECT * FROM buses');  // Chạy nhưng không đợi
console.log('2. End');

// KẾT QUẢ:
// 1. Start
// 2. End
// (Query vẫn đang chạy ở background)


// Có await (Đợi xong mới chạy tiếp)
console.log('1. Start');
const [rows] = await pool.execute('SELECT * FROM buses');  // Đợi xong
console.log('2. Rows:', rows);
console.log('3. End');

// KẾT QUẢ:
// 1. Start
// (đợi query xong - 50ms)
// 2. Rows: [...]
// 3. End
```

---

## 4. KẾT HỢP TẤT CẢ

### Code đầy đủ trong dự án

```javascript
// models/Bus.js

class BusModel {
  static async create(busData) {
    // ✅ Destructuring
    const { bus_number, license_plate, status = 'active' } = busData;
    //     └──────────────────┬──────────────────┘
    //        Lấy 3 thuộc tính từ busData
    //        Nếu không có status, dùng 'active'
    
    // ✅ await - Đợi INSERT xong
    const [result] = await pool.execute(
      //          └─┬─┘
      //        Đợi Promise
      'INSERT INTO buses (bus_number, license_plate, status) VALUES (?, ?, ?)',
      [bus_number, license_plate, status]
      // Dùng các biến từ destructuring
    );
    
    // ✅ await - Đợi SELECT xong
    const newBus = await this.findById(result.insertId);
    //             └─┬─┘
    //         this.findById() là async
    //         nên cần await
    
    return newBus;
  }
  
  static async findById(id) {
    // async function
    const [rows] = await pool.execute('SELECT * FROM buses WHERE id = ?', [id]);
    //             └─┬─┘
    //           await Promise
    return rows[0] || null;
  }
}
```

---

### Gọi từ Service

```javascript
// services/busService.js

class BusService {
  static async createBus(busData) {
    // async function
    
    // ✅ Destructuring
    const { bus_number, license_plate } = busData;
    
    // ✅ await - Gọi async function từ Model
    const existingBus = await BusModel.findByLicensePlate(license_plate);
    //                  └─┬─┘
    //              Đợi Model trả kết quả
    
    if (existingBus) {
      throw new Error('Biển số đã tồn tại');
    }
    
    // ✅ await - Gọi async function từ Model
    const newBus = await BusModel.create(busData);
    //             └─┬─┘
    //         Đợi Model tạo xong
    
    return newBus;
  }
}
```

---

### Gọi từ Routes

```javascript
// routes/BusesRoutes.js

router.post('/', async (req, res) => {
  //                async
  try {
    const busData = req.body;
    
    // ✅ await - Gọi async function từ Service
    const newBus = await BusService.createBus(busData);
    //             └─┬─┘
    //         Đợi Service xử lý xong
    
    res.status(201).json({
      success: true,
      data: newBus
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
```

---

## 5. BÀI TẬP THỰC HÀNH

### Bài 1: Destructuring

```javascript
// Cho object:
const student = {
  name: 'Nguyễn Văn A',
  age: 20,
  class: '10A1',
  address: '123 Đường ABC'
};

// ❌ Viết lại bằng destructuring
const name = student.name;
const age = student.age;
const studentClass = student.class;

// ✅ Đáp án:
const { name, age, class: studentClass } = student;
```

### Bài 2: Async/Await

```javascript
// Viết function lấy danh sách học sinh
// Dùng async/await

// ❌ Cách cũ (Promise)
function getStudents() {
  return pool.execute('SELECT * FROM students')
    .then(([rows]) => {
      return rows;
    });
}

// ✅ Cách mới (async/await)
async function getStudents() {
  const [rows] = await pool.execute('SELECT * FROM students');
  return rows;
}
```

### Bài 3: Kết hợp

```javascript
// Viết function tạo học sinh mới
// Dùng: destructuring, static, async/await

class StudentModel {
  static async create(studentData) {
    // TODO: Destructuring để lấy name, class, grade
    // TODO: await INSERT
    // TODO: await SELECT để lấy học sinh vừa tạo
    // TODO: return học sinh
  }
}

// ✅ Đáp án:
class StudentModel {
  static async create(studentData) {
    const { name, class: className, grade } = studentData;
    
    const [result] = await pool.execute(
      'INSERT INTO students (name, class, grade) VALUES (?, ?, ?)',
      [name, className, grade]
    );
    
    const [rows] = await pool.execute(
      'SELECT * FROM students WHERE id = ?',
      [result.insertId]
    );
    
    return rows[0];
  }
}
```

---

## 6. TÓM TẮT

### Destructuring

```javascript
// Lấy thuộc tính từ object
const { bus_number, license_plate } = busData;

// Tương đương:
const bus_number = busData.bus_number;
const license_plate = busData.license_plate;
```

### Static

```javascript
// Method thuộc class, KHÔNG cần tạo instance
static async findAll() { ... }

// Gọi trực tiếp:
BusModel.findAll();
```

### Async/Await

```javascript
// async: Function bất đồng bộ
async function getData() {
  // await: Đợi Promise hoàn thành
  const result = await pool.execute('SELECT ...');
  return result;
}
```

### Kết hợp

```javascript
class BusModel {
  static async create(busData) {
    const { bus_number, license_plate } = busData;
    const [result] = await pool.execute('INSERT ...');
    return await this.findById(result.insertId);
  }
}
```

---

## 7. CÂU HỎI THƯỜNG GẶP

### Q1: Khi nào dùng destructuring?
**A:** Khi cần lấy nhiều thuộc tính từ object/array. Giúp code ngắn gọn hơn.

### Q2: Tại sao dùng static?
**A:** Vì các method này không cần state của instance, chỉ là utility functions. Gọi trực tiếp từ class tiện hơn.

### Q3: Có thể không dùng await không?
**A:** Được, nhưng sẽ nhận Promise thay vì giá trị thực. Phải dùng `.then()` để xử lý.

### Q4: Có thể dùng await ngoài async function không?
**A:** KHÔNG. `await` CHỈ dùng được trong `async` function.

### Q5: Destructuring có bắt buộc không?
**A:** KHÔNG. Nhưng nên dùng vì code ngắn gọn, dễ đọc hơn.

---

**🎉 Bây giờ bạn đã hiểu rõ 3 khái niệm quan trọng này!**
