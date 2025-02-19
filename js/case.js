// case.js

// Importation des fichiers
import { setValidateGuessFunction } from './common/guessbar.js';
import { dataLoaded, casesData, characterData, setSelectCharacterToFindFunction, setSelectedGroups, attemptedNames, getGroupByTurnabout, setGameMode } from './common/data.js';
import { setHints } from './common/hint.js';
import { incrementNumTries, verifyTries } from './common/life.js';
setGameMode("case");

//////////////////

let targetCase = null;

//////////////////

const inputField = document.getElementById("guessInput");
const validateButton = document.getElementById("validateButton");
const feedback = document.getElementById("feedback");
const historyDiv = document.getElementById("history");
const evidenceContainer = document.getElementById("evidenceContainer");

////////////////// HISTORY

// Assurer la création du tableau dès le début
function createHistoryTable() {
    if (!document.getElementById("historyTable")) {
        historyDiv.innerHTML = `
            <table id="historyTable" class="history-table">
                <thead>
                    <tr>
                        <th>Case</th>
                    </tr>
                </thead>
                <tbody id="historyBody"></tbody>
            </table>
        `;
    }
}
createHistoryTable()

// Ajouter un essai sous forme de nouvelle ligne dans le tableau existant
function addToHistory(guessedCase, result) {
    createHistoryTable(); // Assure que le tableau est bien créé
    const historyBody = document.getElementById("historyBody");

    //historyItem.innerHTML = result ? "🎉" : "❌";
    
    let imageUrl = "";
    if (guessedCase.image && guessedCase.image.length > 0) {
        imageUrl = guessedCase.image.replace(/(\/scale-to-width-down\/\d+|\/revision\/latest\/scale-to-width-down\/\d+|\/revision\/latest\?cb=\d+)/g, "");
    }

    const newRow = document.createElement("tr");
    newRow.innerHTML = `
        <td class="single-cell-oneth ${compareInfoClass(guessedCase.name, targetCase.name)}" >
            <div class="image-container-oneth">
                <img src="${imageUrl}" alt="${guessedCase.name}" class="centered-image-oneth">
            </div>
            <div class="name-below-oneth">${guessedCase.name}</div>
        </td>
    `;

    historyBody.prepend(newRow); // Ajoute en haut du tableau
}

////////////////// FUNCTIONS

function selectCaseToFind() {
    if (!casesData || casesData.length === 0 || !characterData || characterData.length === 0) {
        console.error("Data not loaded yet!");
        return;
    }

    // Appliquer les filtres aux personnages
    let filteredCases = filterCases();
    if (filteredCases.length === 0) {
        console.warn("No characters available after filtering!");
        return;
    }

    function isValidCase(turnabout) {
        if (!turnabout.name || !turnabout.evidence) {
            return false;
        }
        if (turnabout.bypass) {
            return true;
        }

        const attributes = [turnabout.name, turnabout.image, turnabout.evidence, turnabout.victim, turnabout.cause];
        return attributes.filter(attr => attr && attr !== "N/A" && attr !== "Unknown" && attr !== "Unknow").length >= 3;
    }

    let validCases = casesData.filter(isValidCase);
    if (validCases.length === 0) {
        console.error("No valid quotes found!");
        return;
    }

    targetCase = validCases[Math.floor(Math.random() * validCases.length)];


    if (!targetCase) {
        console.error("❌ Aucune citation valide n'a un personnage correspondant dans les personnages filtrés !");
        return;
    }

    let hints = {
        cause: { title: "Death cause", tries: 3, icon: document.querySelector("#hint-cause .hint-icon"), element: document.querySelector("#hint-cause .hint-count"),  text: targetCase.cause },
        victim: { title: "Victim", tries: 7, icon: document.querySelector("#hint-victim .hint-icon"), element: document.querySelector("#hint-victim .hint-count"), text: targetCase.victim },
        //image: { title: "Image", tries: 12, icon: document.querySelector("#hint-image .hint-icon"), element: document.querySelector("#hint-image .hint-count"), image: targetCase.image.replace(/(\/scale-to-width-down\/\d+|\/revision\/latest\/scale-to-width-down\/\d+|\/revision\/latest\?cb=\d+)/g, "") }
        image: { title: "Image", tries: 12, icon: document.querySelector("#hint-image .hint-icon"), element: document.querySelector("#hint-image .hint-count"), text: targetCase.name }
    };

    setHints(hints);
    displayEvidence();
    console.log("✅ Character to find (quote):", targetCase.name);
}

function validateGuess() {
    if (!targetCase) {
        feedback.textContent = "⚠️ The game is still loading. Please wait...";
        feedback.className = "error";
        return;
    }

    const guessCase = inputField.value.trim();
    if (attemptedNames.has(guessCase)) {
        feedback.textContent = "⚠️ This character has already been guessed !";
        feedback.className = "error";
        return;
    }

    const guessedCase = casesData.find(c => c.name.toLowerCase() === guessCase.toLowerCase());

    if (!guessedCase) {
        feedback.textContent = "⚠️ Unknown character.";
        feedback.className = "error";
        return;
    }

    attemptedNames.add(guessCase);

    if (guessCase.toLowerCase() === targetCase.name.toLowerCase()) {
        addToHistory(guessedCase, true);
        feedback.textContent = "🎉 Congratulation ! You found " + targetCase.name + " !";
        feedback.className = "success";
    } else {
        addToHistory(guessedCase, false);
        feedback.textContent = "❌ wrong answer, try again !";
        feedback.className = "error";
    }
    incrementNumTries();
    verifyTries();
    revealNextEvidence()
    inputField.value = "";
    validateButton.disabled = true;
}

////////////////// EVIDENCE DISPLAY

let currentEvidenceIndex = 0;
const maxEvidence = 15; // Nombre maximum d'éléments affichables

function createEvidenceDiv(evidence) {
    if (document.querySelectorAll(".evidence-item").length >= maxEvidence) return;

    const div = document.createElement("div");
    div.classList.add("evidence-item");
    
    const img = document.createElement("img");
    img.src = "/resources/img/icons/hiddenEvidence.png"; // Image cachée par défaut
    img.dataset.revealSrc = evidence.image.replace(/(\/scale-to-width-down\/\d+|\/revision\/latest\/scale-to-width-down\/\d+|\/revision\/latest\?cb=\d+)/g, ""); // Stocke l'image réelle
    img.classList.add("evidence-image");
    
    const name = document.createElement("p");
    name.textContent = evidence.name;
    name.style.display = "none"; // Cache le nom au début
    
    div.appendChild(img);
    div.appendChild(name);
    evidenceContainer.appendChild(div);
}

function displayEvidence() {
    const caseEvidence = targetCase.evidence.slice(0, maxEvidence); // Limite aux 15 premiers éléments
    caseEvidence.forEach(createEvidenceDiv);
}

function revealNextEvidence() {
    const evidenceItems = document.querySelectorAll(".evidence-item");
    if (currentEvidenceIndex < Math.min(evidenceItems.length, maxEvidence)) {
        const img = evidenceItems[currentEvidenceIndex].querySelector(".evidence-image");
        const name = evidenceItems[currentEvidenceIndex].querySelector("p");
        
        img.src = img.dataset.revealSrc; // Affiche la vraie image
        name.style.display = "block"; // Affiche le nom de la preuve
        
        currentEvidenceIndex++;
    }
}


////////////////// COMPARE FUNCTION

// Comparer deux valeurs et appliquer la couleur correspondante
function compareInfoClass(guess, target) {
    // Remplacer les valeurs nulles ou non définies par "Unknown"
    if (!guess || guess === "N/A") {
        guess = "Unknown";
    }
    if (!target || target === "N/A") {
        target = "Unknown";
    }

    // Comparer les valeurs et appliquer la couleur correspondante
    const isCorrect = guess === target;
    return isCorrect ? 'correct' : 'incorrect';
}

//////////// FILTERS

// Récupère la liste des checkboxes et ajoute un écouteur d'événement
const checkboxes = document.querySelectorAll("#groupFilters input[type='checkbox']");

const updateButton = document.querySelector("#updateFilters");
updateButton.addEventListener("click", selectCaseToFind);

// Fonction pour filtrer les personnages en fonction des groupes cochés
function filterCases() {
    const checkboxes = document.querySelectorAll("#groupFilters input[type='checkbox']"); // Assurez-vous que cette ligne existe
    const newSelectedGroups = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

    setSelectedGroups(newSelectedGroups); // Mettre à jour selectedGroups via la fonction setSelectedGroups

    // Filtrer les personnages en fonction du groupe sélectionné
    const filtered = casesData.filter(turnabout => {
        const group = getGroupByTurnabout(turnabout.name);
        return newSelectedGroups.includes(group);
    });

    

    return filtered;
}

//////////// DOMCONTENTLOADED

async function initGame() {
    await dataLoaded; // Attendre que les fichiers JSON soient chargés
    console.log("🚀 Les données sont prêtes, on peut commencer !");
    console.log("Nombre de turnabouts chargées :", casesData.length);

    setValidateGuessFunction(validateGuess);
    setSelectCharacterToFindFunction(selectCaseToFind);

    selectCaseToFind(); // Maintenant on peut l'exécuter
    displayEvidence(); // Charge les preuves masquées
    revealNextEvidence() 
}
initGame();

/*
document.addEventListener("DOMContentLoaded", function () {

});*/