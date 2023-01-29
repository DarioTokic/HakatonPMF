searchContainer = document.getElementById("search_container")
searchField = document.getElementById("search")
rightLeaning = document.getElementsByClassName("right_leaning")[0]


searchContainer.addEventListener("mouseover", function() {
    searchField.classList.add("pokazi");
    rightLeaning.classList.add("pokazi");
});

searchContainer.addEventListener("mouseout", function() {
    searchField.classList.remove("pokazi");
    rightLeaning.classList.remove("pokazi");
});


//uzmem listu registrovanih predavaca i search bar
let kutije = document.getElementsByClassName("search_box")

searchField.addEventListener("input", e => {

    // uzmem vrijednost search bara
    const value = e.target.value.toLowerCase()
    console.log(value)
    for(let i = 0;i<kutije.length;i++){
        //uzmem tekst iz kutije
        let tekst =  kutije[i].querySelector(".search_target").innerHTML
        //provjerim da li se poklapaju search i tekst
        console.log(tekst)
        const isVisible = tekst.toLowerCase().includes(value);
        //sakrijem one koji se ne poklapaju
        kutije[i].classList.toggle("hide", !isVisible)
    }
})
