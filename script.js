const now = new Date();
const hours = now.getHours();
let greeting;

if (hours < 12) {
    greeting = "Good morning!";
} else if (hours < 18) {
    greeting = "Good afternoon!";
} else if (hours == 23){
    greeting = "It's almost midnight!";
}
 else {
    greeting = "Good evening!";
}

document.getElementById("greeting").innerText = greeting;