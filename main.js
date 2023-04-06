let link;
let recipes;
let template = document.getElementById('recipe-template');
let listtemplate = document.getElementById('recipe-list__template');
let main = document.getElementById('recipe-item__wrapper');
let list = document.querySelector('.recipe-list');
let modal = new bootstrap.Modal(document.getElementById('inputModal'));

let toggleList = (elements, target) => {
    elements.forEach(node => node.classList.remove('selected'));
    target.classList.add('selected');
}

function fetchRecipes(){
    return new Promise((resolve, reject) => {
        let recipes = window.localStorage.getItem('recipes');
        // if recipes not in local storage, this would hit the API
        if(!recipes){
            fetch('recipes.json')
            .then(response => response.json())
            .then(data => {
                let newData = data['recipes'];
                window.localStorage.setItem('recipes', JSON.stringify(newData));
                resolve(newData);
            })
            .catch(error => reject(error))
        }else{
            resolve(JSON.parse(recipes))
        }
    })
    
}


async function populateLists () {
    
    return new Promise((resolve, reject) => {
    
    fetchRecipes().then((recipes) => {
    let counter = document.querySelector('.recipe-list__counter');
    counter.innerHTML = recipes.length;
    recipes.forEach((node, index) => {
        let clone = template.content.cloneNode(true);
        let listclone = listtemplate.content.cloneNode(true);
        main.appendChild(clone);
        let item = document.querySelectorAll('.recipe-item__item')[index];
        item.querySelector(`:scope .anchor`).setAttribute('id', `item-${index}`)
        item.querySelector(`:scope h2`).innerHTML = node.title;
        item.querySelector(`:scope .recipe-item__description`).innerHTML = node.description;
        item.querySelector(`:scope .recipe-item__description`).setAttribute('id', `desc-${index}`);
        item.querySelector(`:scope .recipe-item__imagewrapper`).dataset.name = node.title;
        item.querySelector(`:scope .recipe-item__difficulty`).classList.add(`level-${node.difficulty}`);
        item.querySelector(`:scope .recipe-item__minutes`).innerHTML = node.duration;
        item.querySelector(`:scope img`).setAttribute('src', node.image);
        item.querySelector(`:scope .recipe-item__share`).dataset['index'] = index;
        item.querySelector(`:scope img`).setAttribute('aria-describedby', `desc-${index}`);
        if(node.ingredients){
        node.ingredients.forEach(ing => {
            let tr = document.createElement('tr');
            let td = document.createElement('td');
            td.innerHTML = ing;
            tr.appendChild(td);
            item.querySelector(`:scope .recipe-item__ingredients`).appendChild(tr);
        })
        }
        let listitem = document.createElement('li');
        listitem.classList.add('recipe-list__item');
        let a = document.createElement('a');
        a.classList.add('recipe-list__link');
        a.innerHTML = node.title;
        a.setAttribute('href', `#item-${index}`);
        listitem.appendChild(a);
        list.appendChild(listitem);
        link = document.querySelectorAll(`.recipe-list__link`);
        link.forEach(node => node.addEventListener('click', (e) => {
            toggleList(link, e.currentTarget);
        }))
    })
    });
    resolve();

})

}

async function setUpPage() {
    populateLists().then(() => {
        initShare();
        initObserver();
        let body = document.querySelector('body');
        body.classList.add('ready');
    })
}

setUpPage();

// Share Buttons
let initShare = () => {
    let shareButtons = document.querySelectorAll('.shareButton');
    shareButtons.forEach(node => {
        node.addEventListener('click', function(){
            let index = node.parentNode.dataset['index'];
            sendRecipe(index);
        })
    })
}

function sendRecipe(index){
    let recipes = JSON.parse(window.localStorage.getItem('recipes'));
    let recipeItem = recipes[index];
    let title = recipeItem['title'];
    let description = recipeItem['description'];
    let duration = recipeItem['duration'];
    let difficulty = recipeItem['difficulty'];
    let ingredients = recipeItem['ingredients'];
    let link = window.location;
    const email = "matthias.campe@gmx.de";
    const subject = `🥦 Recipe for ${title} 🥦`;
    const body = `Hi,\n\nHere is a great recipe for ${title}!\n\n${description}\n\nThe difficulty level is ${difficulty} of 5.\n\n You will need approx. ${duration} minutes for it.\n\n Here are the ingredients\n\n${ingredients}\n\nSee the recipe here: ${link}`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}



// Observe
let initObserver = () => {
    const recipeItems = document.querySelectorAll('.recipe-item__item');


const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.intersectionRatio > 0 && Array.from(recipeItems).some(item => item === entry.target)) {
        let id =entry.target.querySelector('.anchor').id;
        // window.location.replace(
        //     `#${id}`
        //   );
      let target = document.querySelector(`[href="#${id}"]`);
      toggleList(link, target);
    }
  });
},{
    rootMargin: '-50% 0px 0px 0px'
  });

recipeItems.forEach(recipeItem => observer.observe(recipeItem));
}

document.getElementById('submit-form').addEventListener('click', function(){
    addRecipe();
})

document.getElementById('add-ingredient').addEventListener('click', function(e){
    e.preventDefault();
    addIngredient();
})

function addIngredient(){
    let ingredientTemplate = document.getElementById('ingredient-input__template');
    let inputClone = ingredientTemplate.content.cloneNode(true);
    let ingredientList = document.getElementById('ingredient-input__list');
    ingredientList.append(inputClone);
    let ingredientInputs = ingredientList.querySelectorAll('.form-control');
    let counter = ingredientInputs.length;
    let newInput = ingredientInputs.item(counter-1);
    newInput.setAttribute('placeholder', `Ingredient #${counter}`);
}

function addRecipe() {
    let recipe = JSON.parse(window.localStorage.getItem('recipes'));
    let form = document.querySelector('form');
    let newRecipe = new Object();
    newRecipe['ingredients'] = [];
    newRecipe['image'] = "https://lipsum.app/640x480";
    for (let i = 0; i < form.elements.length; i++) {
        const element = form.elements[i];
        if (element.name === 'ingredient' && element.value.length) {
            newRecipe['ingredients'].push(element.value);
        }else{
            newRecipe[element.name] = element.value;
        }
      }
    recipe.unshift(newRecipe);
    window.localStorage.setItem('recipes', JSON.stringify(recipe));
    modal.hide();
    cleanUpPage()
    .then(setUpPage())
    setTimeout(function(){
        form.reset();
    }, 1000)
}



function cleanUpPage(){
    return new Promise((resolve, reject) => {
        let articles = document.getElementsByTagName('article');
        let ul = document.querySelectorAll('.recipe-list__item');
        let a = [...articles];
        a.forEach((node, index) => {
            a[index].remove();
        })
        ul.forEach((node, index) => {
            ul[index].remove();
        })
        resolve();
    })
}

let ranges = document.querySelectorAll('input[type="range"');

ranges.forEach(node => {
    node.addEventListener('click', function(e){
        if(node.getAttribute('name') == 'difficulty'){
            let filter = 'level';
            let el = node.parentNode.querySelector('.recipe-input__difficulty');
            let currentClasses = el.className.split(" ");
            let newClasses = currentClasses.filter(function(v){
                return v.lastIndexOf(filter, 0) !== 0;
            })

            el.className = newClasses.join(" ").trim();
            let val = parseInt(node.value);
            el.classList.add(`level-${val}`)
        }else{
            let el = node.parentNode.querySelector('.feedback');
            el.innerHTML = node.value;
        }
    })
})


function inputRangeFeedback(){

}



