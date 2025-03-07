///// COOKIE SETUP /////
import { validateGuessFunction } from './guessbar.js';

export let streaks = {};
streaks.guessStreak = setupStreakCookie("guessStreak");
streaks.silhouetteStreak = setupStreakCookie("silhouetteStreak");
streaks.quoteStreak = setupStreakCookie("quoteStreak");
streaks.caseStreak = setupStreakCookie("caseStreak");

if(readCookie("filter").length === 0){
    setCookie("filter", ["Main"]);
}else{
    setCookie("filter", readCookie("filter"));
}


//console.log(streaks);

function setupStreakCookie(name){
    let streak;

    if(readCookie(name).length === 0){
        streak = 0;
    }
    else {
        streak = readCookie(name);
        console.log("🔥 Current streak for " + name.replace("Streak","") + " : " + streak);
    }
    
    setCookie(name, streak);
    return streak;
}

export function loadHistory(cookieName, cookieList){
    let cookieAttempts = readJsonCookie(cookieName);
    if (cookieAttempts) {
        cookieList = cookieAttempts;
    }
    
    console.log(cookieList);

    if(cookieList && cookieList.length > 0) {
        cookieList.forEach((attempt) => {
            validateGuessFunction(attempt);
        });
    }
}


////////

export function readCookie(name){
    return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
}

export function readJsonCookie(name){
    return JSON.parse(decodeURIComponent(document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || ''));
}

export function setCookie(cookieName, value){
    document.cookie = cookieName + "=" + value;
}