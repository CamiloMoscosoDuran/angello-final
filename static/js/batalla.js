let pollo = 0, pizza = 0;

const polloEl = document.getElementById("polloPts");
const pizzaEl = document.getElementById("pizzaPts");
const barPollo = document.getElementById("barPollo");
const barPizza = document.getElementById("barPizza");
const winner = document.getElementById("winnerText");

document.getElementById("addPollo").addEventListener("click", ()=>{
    pollo++; actualizar();
});
document.getElementById("addPizza").addEventListener("click", ()=>{
    pizza++; actualizar();
});
document.getElementById("resetBtn").addEventListener("click", ()=>{
    pollo = 0; pizza = 0; actualizar();
});

function actualizar(){
    polloEl.textContent = pollo;
    pizzaEl.textContent = pizza;

    const total = pollo + pizza || 1;
    const polloPercentage = Math.round((pollo/total)*100);
    const pizzaPercentage = Math.round((pizza/total)*100);
    
    // Ajustar los anchos para que siempre sumen 100%
    barPollo.style.width = polloPercentage + "%";
    barPizza.style.width = pizzaPercentage + "%";

    // Mostrar porcentajes en las barras
    barPollo.textContent = polloPercentage + "%";
    barPizza.textContent = pizzaPercentage + "%";

    // Ajustar border-radius dinámicamente
    if (polloPercentage >= 99) {
        barPollo.style.borderRadius = "25px";
        barPizza.style.borderRadius = "0";
    } else if (pizzaPercentage >= 99) {
        barPizza.style.borderRadius = "25px";
        barPollo.style.borderRadius = "0";
    } else {
        barPollo.style.borderRadius = "25px 0 0 25px";
        barPizza.style.borderRadius = "0 25px 25px 0";
    }

    // Actualizar mensaje del ganador
    if(pollo > pizza){
        winner.textContent = "¡POLLO VA GANANDO! 🍗";
        winner.style.color = "#ff5722";
    } else if (pizza > pollo){
        winner.textContent = "¡PIZZA VA GANANDO! 🍕";
        winner.style.color = "#2196f3";
    } else {
        winner.textContent = "¡EMPATE! 🤝";
        winner.style.color = "#00ffff";
    }
}
