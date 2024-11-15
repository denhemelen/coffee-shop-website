// 1. IIFE для виведення мови браузера
(function() {
    console.log("Мова браузера:", window.clientInformation.language);
})();

// 2. Методи роботи з масивами: map, filter, reduce
// a. Масив чисел
const numbers = [12, 25, 47, 30, 62, 15, 80, 54, 91, 34];

// b. Подвоєння кожного числа
const doubledNumbers = numbers.map(num => num * 2);
console.log("Подвоєні числа:", doubledNumbers);

// c. Фільтрація чисел більше 40
const filteredNumbers = numbers.filter(num => num > 40);
console.log("Числа більше 40:", filteredNumbers);

// d. Підсумовування всіх елементів масиву
const sum = numbers.reduce((acc, num) => acc + num, 0);
console.log("Сума всіх елементів:", sum);

// 3. Функція з Rest Parameters
function sumAll(...args) {
    return args.reduce((acc, num) => acc + num, 0);
}
console.log("Сума всіх аргументів:", sumAll(1, 2, 3, 4, 5));  // Приклад виклику

// 4. Робота з Map
// a. Створення Map та додавання ключ-значення
const studentScores = new Map();
studentScores.set("Михайловський", 85);
studentScores.set("Денис", 92);
studentScores.set("Володимирович", 78);

// b. Перебирання Map з виведенням ключів і значень
for (const [name, score] of studentScores) {
    console.log(`Ім'я: ${name}, Бал: ${score}`);
}

// 5. Зміна контексту функції за допомогою call та apply
// a. Об'єкт person та функція greet
const person = {
    firstName: "група",
    lastName: "ІПЗм-41"
};

function greet() {
    console.log(` ${this.firstName} ${this.lastName}!`);
}

// Виклик greet з різними об'єктами
const anotherPerson = { firstName: "Лабораторна", lastName: "5" };
greet.call(person);
greet.apply(anotherPerson);

// 6. Створення функції із замиканням (closure)
function createCounterWithStart(start) {
    let count = start;
    return function() {
        console.log(count);
        count++;
    };
}

const counter = createCounterWithStart(5);
counter(); // Виведе 5
counter(); // Виведе 6
counter(); // Виведе 7
