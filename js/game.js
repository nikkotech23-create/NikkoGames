// ====== DATA: QUESTIONS PER CATEGORY ======

const questions = {
  astronomy: [
    { q: "What is the largest planet in our solar system?", a: "Jupiter", o: ["Mars", "Earth", "Jupiter", "Saturn"] },
    { q: "What galaxy do we live in?", a: "Milky Way", o: ["Andromeda", "Milky Way", "Sombrero", "Whirlpool"] },
    { q: "What is the Sun mostly made of?", a: "Hydrogen", o: ["Iron", "Carbon", "Hydrogen", "Helium"] },
    { q: "Which planet has the most moons?", a: "Saturn", o: ["Earth", "Mars", "Jupiter", "Saturn"] },
    { q: "What is a light-year?", a: "Distance", o: ["Time", "Brightness", "Distance", "Speed"] },
    { q: "Closest star to Earth (after the Sun)?", a: "Proxima Centauri", o: ["Sirius", "Vega", "Proxima Centauri", "Betelgeuse"] },
    { q: "Which planet is known as the Red Planet?", a: "Mars", o: ["Venus", "Mars", "Mercury", "Neptune"] },
    { q: "What force keeps planets in orbit?", a: "Gravity", o: ["Magnetism", "Wind", "Gravity", "Pressure"] },
    { q: "What type of galaxy is the Milky Way?", a: "Spiral", o: ["Elliptical", "Irregular", "Spiral", "Ring"] },
    { q: "What is the name of our Moon?", a: "The Moon", o: ["Luna", "Selene", "The Moon", "Gaia"] }
  ],
  movies: [
    { q: "Who directed 'Inception'?", a: "Christopher Nolan", o: ["Steven Spielberg", "Quentin Tarantino", "Christopher Nolan", "Ridley Scott"] },
    { q: "Which movie features Jack Sparrow?", a: "Pirates of the Caribbean", o: ["Titanic", "Pirates of the Caribbean", "Avatar", "Gladiator"] },
    { q: "Which film is about a blue alien world called Pandora?", a: "Avatar", o: ["Avatar", "Dune", "Star Wars", "Interstellar"] },
    { q: "Who played the Joker in 'The Dark Knight'?", a: "Heath Ledger", o: ["Jared Leto", "Heath Ledger", "Joaquin Phoenix", "Christian Bale"] },
    { q: "Which movie has the quote 'I'll be back'?", a: "The Terminator", o: ["Rocky", "Predator", "The Terminator", "Rambo"] },
    { q: "What is the name of the wizarding school in Harry Potter?", a: "Hogwarts", o: ["Durmstrang", "Beauxbatons", "Hogwarts", "Ilvermorny"] },
    { q: "Which movie features a DeLorean time machine?", a: "Back to the Future", o: ["The Matrix", "Back to the Future", "Looper", "Tenet"] },
    { q: "Who directed 'Pulp Fiction'?", a: "Quentin Tarantino", o: ["Christopher Nolan", "Quentin Tarantino", "Martin Scorsese", "James Cameron"] },
    { q: "In 'The Lion King', what is Simba’s father’s name?", a: "Mufasa", o: ["Scar", "Mufasa", "Rafiki", "Zazu"] },
    { q: "Which film is about dreams within dreams?", a: "Inception", o: ["Memento", "Inception", "Shutter Island", "The Prestige"] }
  ],
  history: [
    { q: "Who was the first President of the United States?", a: "George Washington", o: ["Abraham Lincoln", "Thomas Jefferson", "George Washington", "John Adams"] },
    { q: "In which year did World War II end?", a: "1945", o: ["1939", "1942", "1945", "1950"] },
    { q: "Where were the pyramids of Giza built?", a: "Egypt", o: ["Mexico", "China", "Egypt", "India"] },
    { q: "Who is credited with discovering America in 1492?", a: "Christopher Columbus", o: ["Ferdinand Magellan", "Christopher Columbus", "Amerigo Vespucci", "James Cook"] },
    { q: "Which empire built the Colosseum?", a: "Roman Empire", o: ["Greek Empire", "Roman Empire", "Ottoman Empire", "Persian Empire"] },
    { q: "Who was known as the Maid of Orléans?", a: "Joan of Arc", o: ["Cleopatra", "Joan of Arc", "Elizabeth I", "Catherine the Great"] },
    { q: "What wall fell in 1989, symbolizing the end of the Cold War?", a: "Berlin Wall", o: ["Great Wall of China", "Berlin Wall", "Hadrian's Wall", "Iron Curtain"] },
    { q: "Who was the first man to walk on the Moon?", a: "Neil Armstrong", o: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "Michael Collins"] },
    { q: "Which war was fought between the North and South of the United States?", a: "American Civil War", o: ["World War I", "American Civil War", "Revolutionary War", "Vietnam War"] },
    { q: "Which Macedonian king created a vast empire by age 30?", a: "Alexander the Great", o: ["Julius Caesar", "Napoleon Bonaparte", "Alexander the Great", "Hannibal Barca"] }
  ],
  culture: [
    { q: "What is the capital of Japan?", a: "Tokyo", o: ["Kyoto", "Osaka", "Tokyo", "Nagoya"] },
    { q: "Which language has the most native speakers?", a: "Mandarin Chinese", o: ["English", "Spanish", "Mandarin Chinese", "Hindi"] },
    { q: "What is sushi traditionally wrapped in?", a: "Seaweed", o: ["Rice", "Seaweed", "Soy paper", "Lettuce"] },
    { q: "On which continent is the Sahara Desert?", a: "Africa", o: ["Asia", "Africa", "Australia", "South America"] },
    { q: "What is the longest river in the world (by most traditional measures)?", a: "Nile", o: ["Amazon", "Yangtze", "Nile", "Danube"] },
    { q: "Which country is famous for inventing pizza in its modern form?", a: "Italy", o: ["France", "Italy", "United States", "Greece"] },
    { q: "What is the largest ocean on Earth?", a: "Pacific Ocean", o: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"] },
    { q: "What is the main ingredient in guacamole?", a: "Avocado", o: ["Tomato", "Avocado", "Pepper", "Corn"] },
    { q: "Which country is home to the Taj Mahal?", a: "India", o: ["India", "Pakistan", "Nepal", "Bangladesh"] },
    { q: "What is the currency of the United Kingdom?", a: "Pound Sterling", o: ["Euro", "US Dollar", "Pound Sterling", "Swiss Franc"] }
  ],
  travel: [
    { q: "Which city is known as the 'City of Love'?", a: "Paris", o: ["Rome", "Paris", "Venice", "Prague"] },
    { q: "Which country is home to the Great Barrier Reef?", a: "Australia", o: ["Australia", "Indonesia", "Philippines", "Fiji"] },
    { q: "Which city has the famous landmark Big Ben?", a: "London", o: ["Dublin", "London", "Edinburgh", "Manchester"] },
    { q: "Machu Picchu is located in which country?", a: "Peru", o: ["Peru", "Chile", "Mexico", "Bolivia"] },
    { q: "Which country is known for the city of Tokyo?", a: "Japan", o: ["China", "Japan", "South Korea", "Thailand"] },
    { q: "Which European city is famous for its canals and gondolas?", a: "Venice", o: ["Amsterdam", "Venice", "Bruges", "Copenhagen"] },
    { q: "Which continent is the country of Kenya in?", a: "Africa", o: ["Asia", "Africa", "Europe", "South America"] },
    { q: "Which country is known for the Eiffel Tower?", a: "France", o: ["France", "Spain", "Germany", "Belgium"] },
    { q: "Which city is home to Times Square?", a: "New York City", o: ["Los Angeles", "New York City", "Chicago", "Miami"] },
    { q: "Which country has the city of Rio de Janeiro?", a: "Brazil", o: ["Argentina", "Brazil", "Portugal", "Colombia"] }
  ],
  sports: [
    { q: "How many players are on the field for one football (soccer) team?", a: "11", o: ["9", "10", "11", "12"] },
    { q: "In which sport is the term 'love' used for a score of zero?", a: "Tennis", o: ["Tennis", "Basketball", "Cricket", "Rugby"] },
    { q: "Which country has won the most FIFA World Cups?", a: "Brazil", o: ["Germany", "Italy", "Brazil", "Argentina"] },
    { q: "In basketball, how many points is a shot from beyond the arc worth?", a: "3", o: ["1", "2", "3", "4"] },
    { q: "Which sport uses a bat, ball, and wickets?", a: "Cricket", o: ["Baseball", "Cricket", "Hockey", "Rugby"] },
    { q: "In which sport would you perform a slam dunk?", a: "Basketball", o: ["Volleyball", "Basketball", "Handball", "Tennis"] },
    { q: "The Olympic Games originated in which country?", a: "Greece", o: ["Italy", "Greece", "France", "Egypt"] },
    { q: "Which sport is associated with Wimbledon?", a: "Tennis", o: ["Tennis", "Golf", "Rugby", "Cricket"] },
    { q: "In which sport do teams compete for the Stanley Cup?", a: "Ice Hockey", o: ["Ice Hockey", "Basketball", "Baseball", "American Football"] },
    { q: "What is the maximum score in a single frame of bowling?", a: "30", o: ["20", "25", "30", "40"] }
  ],
  technology: [
    { q: "What does 'CPU' stand for?", a: "Central Processing Unit", o: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Utility"] },
    { q: "Which company created the iPhone?", a: "Apple", o: ["Microsoft", "Apple", "Google", "Samsung"] },
    { q: "What does 'HTTP' stand for?", a: "HyperText Transfer Protocol", o: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "Hyperlink Transfer Process", "Host Transfer Text Protocol"] },
    { q: "Which operating system is developed by Microsoft?", a: "Windows", o: ["Linux", "macOS", "Windows", "Android"] },
    { q: "What is the name of the global network of computers?", a: "The Internet", o: ["The Web", "The Internet", "The Grid", "The Cloud"] },
    { q: "What does 'AI' stand for?", a: "Artificial Intelligence", o: ["Automated Interface", "Artificial Intelligence", "Advanced Internet", "Applied Informatics"] },
    { q: "Which company developed the Android operating system?", a: "Google", o: ["Apple", "Google", "IBM", "Intel"] },
    { q: "What does 'USB' stand for?", a: "Universal Serial Bus", o: ["Universal Serial Bus", "Unified System Bridge", "Universal Signal Board", "User System Bus"] },
    { q: "What is the term for malicious software designed to harm a computer?", a: "Malware", o: ["Firewall", "Malware", "Backup", "Patch"] },
    { q: "What does 'Wi-Fi' primarily allow devices to do?", a: "Connect wirelessly to a network", o: ["Store data", "Connect wirelessly to a network", "Print documents", "Charge batteries"] }
  ],
  food: [
    { q: "Which country is famous for sushi?", a: "Japan", o: ["China", "Japan", "Thailand", "Vietnam"] },
    { q: "Which ingredient makes bread rise?", a: "Yeast", o: ["Salt", "Sugar", "Yeast", "Oil"] },
    { q: "Guacamole is primarily made from which fruit?", a: "Avocado", o: ["Tomato", "Avocado", "Banana", "Apple"] },
    { q: "Which country is famous for tacos?", a: "Mexico", o: ["Spain", "Mexico", "Portugal", "Brazil"] },
    { q: "What type of food is brie?", a: "Cheese", o: ["Bread", "Cheese", "Meat", "Fruit"] },
    { q: "Which grain is used to make traditional Italian risotto?", a: "Rice", o: ["Barley", "Rice", "Wheat", "Corn"] },
    { q: "What is the main ingredient in hummus?", a: "Chickpeas", o: ["Lentils", "Chickpeas", "Beans", "Peas"] },
    { q: "Which fruit is known as the 'king of fruits' in some countries?", a: "Durian", o: ["Mango", "Durian", "Pineapple", "Papaya"] },
    { q: "Which country is famous for croissants?", a: "France", o: ["France", "Belgium", "Italy", "Austria"] },
    { q: "What is tofu primarily made from?", a: "Soybeans", o: ["Rice", "Soybeans", "Wheat", "Corn"] }
  ],
  comics: [
    { q: "Which superhero is also known as the Dark Knight?", a: "Batman", o: ["Superman", "Batman", "Iron Man", "Spider-Man"] },
    { q: "Which company publishes Spider-Man comics?", a: "Marvel", o: ["DC", "Marvel", "Image", "Dark Horse"] },
    { q: "Which superhero is from Krypton?", a: "Superman", o: ["Batman", "Superman", "Green Lantern", "Flash"] },
    { q: "Who is the alter ego of Iron Man?", a: "Tony Stark", o: ["Steve Rogers", "Tony Stark", "Bruce Wayne", "Peter Parker"] },
    { q: "Which superhero uses a magic lasso and bracelets?", a: "Wonder Woman", o: ["Black Widow", "Wonder Woman", "Captain Marvel", "Supergirl"] },
    { q: "Which team includes heroes like Wolverine and Cyclops?", a: "X-Men", o: ["Avengers", "Justice League", "X-Men", "Fantastic Four"] },
    { q: "Which villain is known as Batman’s arch-enemy?", a: "The Joker", o: ["Lex Luthor", "The Joker", "Thanos", "Green Goblin"] },
    { q: "Which superhero can climb walls and shoot webs?", a: "Spider-Man", o: ["Spider-Man", "Ant-Man", "Hawkeye", "Nightcrawler"] },
    { q: "Which hero wields a hammer called Mjölnir?", a: "Thor", o: ["Thor", "Loki", "Hulk", "Odin"] },
    { q: "Which superhero team includes Iron Man, Thor, and Captain America?", a: "The Avengers", o: ["The Avengers", "Justice League", "Guardians of the Galaxy", "Teen Titans"] }
  ]
};

// ====== STATE ======

let currentCategory = null;
let currentIndex = 0;
let currentScore = 0;

// DOM references
const screenCategories = document.getElementById("screen-categories");
const screenQuiz = document.getElementById("screen-quiz");
const screenResult = document.getElementById("screen-result");

const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const questionCounter = document.getElementById("question-counter");

const scoreSpan = document.getElementById("score");
const bestScoreSpan = document.getElementById("best-score");
const currentCategoryLabel = document.getElementById("current-category-label");

const finalScoreSpan = document.getElementById("final-score");
const finalBestScoreSpan = document.getElementById("final-best-score");

const backToMenuBtn = document.getElementById("back-to-menu");
const playAgainBtn = document.getElementById("play-again");
const chooseAnotherBtn = document.getElementById("choose-another");


// ====== EVENT LISTENERS ======

document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", () => {
    const cat = card.getAttribute("data-category");
    playSound(soundClick);
    startCategory(cat);
  });
});

backToMenuBtn.addEventListener("click", () => {
  playSound(soundClick);
  setBodyCategoryClass(null);
  currentCategoryLabel.textContent = "Select a category";
  showScreen("categories");
});

playAgainBtn.addEventListener("click", () => {
  playSound(soundClick);
  if (currentCategory) {
    startCategory(currentCategory);
  } else {
    showScreen("categories");
  }
});

chooseAnotherBtn.addEventListener("click", () => {
  playSound(soundClick);
  setBodyCategoryClass(null);
  currentCategoryLabel.textContent = "Select a category";
  showScreen("categories");
});

// ====== INIT ======

(function init() {
  setBodyCategoryClass(null);
  showScreen("categories");
})();
