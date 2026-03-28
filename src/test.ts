import { Chat } from "./sdks/lens";

const chat = new Chat("askjdasd", true);
console.log(await chat.push("hey"));
console.log(await chat.push("list all"));
console.log(await chat.push("create main.py"));
console.log(await chat.push("edit main.py to create a tkinter editor"));
console.log(await chat.push("run it"));
