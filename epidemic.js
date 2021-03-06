// the number of healthy people in a given age cohort
// source: https://www.demografie-portal.de/SharedDocs/Informieren/DE/ZahlenFakten/Bevoelkerung_Altersstruktur.html

let healthyCohorts;
let allCohorts;
let totalSick = [];
let totalCured = [];
let totalHealthy = [];
let totalDeceased = [];
let newInfections = [];
let dates = [];

let totalInfections = 0;
let stopped = true;
let t = 0;
let initialSick = 200;
let paused = false;

// the mean duration of an infection
let sicknessDuration = 14;
// the mortality of the disease (in percent) for the different age groups

// https://www.worldometers.info/coronavirus/coronavirus-age-sex-demographics/
let mortalityPoints = [[10, 0.2], [40, 0.2], [50, 0.4], [60, 3.6], [70, 8.0], [80, 14.8], [101, 21.9]];

let mortality = [];
let j = 0;
let lm = 0.0;
let lage = 0;
for(let i=0;i<=100;i++){
    let age = mortalityPoints[j][0];
    let m = mortalityPoints[j][1];
    let p = (i-lage)/(age-lage);
    v = p*m+(1-p)*lm;
    mortality.push(v);
    if (age == i){
        j++;
        lm = m;
        lage = age;
    }
}

// the overall infection rate of a sick person
let infectionRate = 2.6;

// the number of sick people in a given age cohort
// we store the number of sick people for each age cohort and days since infection 
let sickCohorts = [];
let allSickCohorts = [];
let curedCohorts = [];
let deceasedCohorts = [];

let dailyInfectionRate;

let dailyMortality = [];

function updateInfectionRate(){
    dailyInfectionRate = infectionRate/sicknessDuration;

}

function initialize(){

    totalInfections = 0;
    t = 0;

    healthyCohorts = [783978, 796374, 802651, 776763, 766631, 739729, 736749, 720613, 738238, 726909, 746345, 741530, 726923, 735760, 751622, 752351, 766517, 787745, 835762, 861102, 891659, 934518, 929523, 916924, 934648, 967092, 985364, 1021919, 1116459, 1102501, 1127589, 1103635, 1083657, 1050793, 1043355, 1045184, 1065675, 1056516, 1060769, 1009272, 995070, 985641, 966513, 941433, 953081, 959668, 1038269, 1140019, 1180738, 1265825, 1323697, 1356220, 1389766, 1391794, 1414471, 1399366, 1351589, 1327937, 1279695, 1239631, 1166642, 1135091, 1098993, 1059645, 1033543, 994300, 986573, 960173, 953314, 914137, 827191, 770080, 662844, 575993, 760437, 761531, 726066, 865057, 887604, 849126, 761230, 679410, 622557, 563565, 484835, 357898, 323304, 295105, 275102, 231157, 194558, 152847, 123290, 96500, 69596, 51076, 37456, 27559, 18243, 9849, 5324];
    allCohorts = [783978, 796374, 802651, 776763, 766631, 739729, 736749, 720613, 738238, 726909, 746345, 741530, 726923, 735760, 751622, 752351, 766517, 787745, 835762, 861102, 891659, 934518, 929523, 916924, 934648, 967092, 985364, 1021919, 1116459, 1102501, 1127589, 1103635, 1083657, 1050793, 1043355, 1045184, 1065675, 1056516, 1060769, 1009272, 995070, 985641, 966513, 941433, 953081, 959668, 1038269, 1140019, 1180738, 1265825, 1323697, 1356220, 1389766, 1391794, 1414471, 1399366, 1351589, 1327937, 1279695, 1239631, 1166642, 1135091, 1098993, 1059645, 1033543, 994300, 986573, 960173, 953314, 914137, 827191, 770080, 662844, 575993, 760437, 761531, 726066, 865057, 887604, 849126, 761230, 679410, 622557, 563565, 484835, 357898, 323304, 295105, 275102, 231157, 194558, 152847, 123290, 96500, 69596, 51076, 37456, 27559, 18243, 9849, 5324];

    sickCohorts = [];
    allSickCohorts = [];
    curedCohorts = [];
    deceasedCohorts = [];
    dailyMortality = [];
    newInfections = [];

    totalSick = [];
    totalCured = [];
    totalHealthy = [];
    totalDeceased = [];
    dates = [];

    for(let i=0;i<healthyCohorts.length;i++){
        let sickCohort = [];
        for(let j=0;j<sicknessDuration;j++){
            sickCohort.push(0);
        }
        allSickCohorts.push(0);
        sickCohorts.push(sickCohort);
        curedCohorts.push(0);
        deceasedCohorts.push(0);
    }

    let nSick = initialSick;

    while (nSick > 0){
        const incr = Math.min(Math.max(initialSick/500, 1), nSick);
        const cohort = random(healthyCohorts.length);
        sickCohorts[cohort][0] += incr;
        allSickCohorts[cohort] += incr;
        nSick -= incr;
    }

    updateInfectionRate();

    // we convert this overall mortality to the daily mortality for sick cohorts
    dailyMortality = []
    for(let i=0;i<mortality.length;i++){
        dailyMortality.push(1.0-Math.pow(1.0-mortality[i]/100.0, 1.0/sicknessDuration));
    }
    
}



function random(n){
    return Math.floor(Math.random()*n);
}

function evolve(){
    let newSickCohorts = [];
    let newAllSickCohorts = [];
    let newDeceasedCohorts = [];
    let newCuredCohorts = [];
    let totalSick = 0;
    // first we go through the sick cohorts. For each sick person...
    for(let i=0;i<sickCohorts.length;i++){
        let totalDeaths = 0;
        let newSickCohort = [0];
        for(let j=0;j<sickCohorts[i].length;j++){
            const sick = sickCohorts[i][j];
            totalSick += sick
            // ...we calculate how many people from this cohort will die
            let deaths = Math.round(dailyMortality[i]*sick);
            // ... and we add the deceased people to the cohorts.
            totalDeaths += deaths;
            if (j == sickCohorts[i].length-1){
                // these people made it, they're cured!
                newCuredCohorts.push(curedCohorts[i]+sick-deaths);
            } else {
                // we move all people that did not die one day further
                newSickCohort.push(sick-deaths);
            }
        }
        newSickCohorts.push(newSickCohort);
        // we tally up the deceased
        newDeceasedCohorts.push(totalDeaths+deceasedCohorts[i]);
    }
    // now we calculate how many new infections we will have from this cohort
    let newCohortInfections = Math.ceil(dailyInfectionRate*totalSick);
    let newlyInfectedPeople = 0;
    let increase = Math.ceil(newCohortInfections/500);
    while (newlyInfectedPeople < newCohortInfections) {
        // we randomly pick an age cohort
        let age = random(healthyCohorts.length);
        let healthyPeople = healthyCohorts[age];
        let allPeople = allCohorts[age];
        // only healthy people can be infected, if we assume that the chance of
        // meeting a sick or cured person is the same as meeting a healthy person
        // it means the virality will be proportionally reduced the more such
        // people are present in a given cohort.
        // in the beginning, the immunity will be 0
        let immunity = 1.0-healthyPeople/allPeople;
        let maximumIncrease = Math.min(increase, healthyPeople);
        let newlyInfectedFromCohort = Math.ceil(maximumIncrease*(1.0-immunity));
        healthyCohorts[age]-=newlyInfectedFromCohort;
        newSickCohorts[age][0]+=newlyInfectedFromCohort;
        totalInfections += newlyInfectedFromCohort;
        newlyInfectedPeople += maximumIncrease;
    }
    for(let i=0;i<newSickCohorts.length;i++){
        let allSick = 0;
        for(let j=0;j<newSickCohorts[i].length;j++){
            allSick +=newSickCohorts[i][j];
        }
        newAllSickCohorts.push(allSick);
    }
    allSickCohorts = newAllSickCohorts;
    sickCohorts = newSickCohorts;
    deceasedCohorts = newDeceasedCohorts;
    curedCohorts = newCuredCohorts;
}

function getTotalSick(){
    let totalSick = 0;
    for(let i=0;i<sickCohorts.length;i++){
        for(let j=0;j<sickCohorts[i].length;j++){
            totalSick+=sickCohorts[i][j];
        }
    }
    return totalSick;
}

function getTotalDeceased(){
    let totalDeceased = 0;
    for(let i=0;i<deceasedCohorts.length;i++){
        totalDeceased += deceasedCohorts[i];
    }
    return totalDeceased;
}

function getTotalCured(){
    let totalCured = 0;
    for(let i=0;i<curedCohorts.length;i++){
        totalCured += curedCohorts[i];
    }
    return totalCured;
}

function getTotalHealthy(){
    let totalHealthy = 0;
    for(let i=0;i<healthyCohorts.length;i++){
        totalHealthy += healthyCohorts[i];
    }
    return totalHealthy;
}

function barChart(id, allBars, opts){

    if (opts === undefined)
        opts = {}

    const plot = document.getElementById(id);
    const barMargin = plot.clientWidth > 600 ? 2: 0;
    const bottomMargin = 40;
    const leftMargin = 60;
    const plotHeight = 200;
    const n = allBars[0].length;
    const nHorizonalTicks = Math.min(plot.clientWidth/100, n/10);
    const container = document.createElement("div");
    container.style.height = (plotHeight+bottomMargin)+"px";
    container.style.width = "100%";

    if (plot.hasChildNodes())
        plot.replaceChild(container, plot.childNodes[0])
    else
        plot.appendChild(container);

    const plotWidth = container.clientWidth-leftMargin-n*barMargin;
    const barWidth = Math.max(1, Math.min(20, plotWidth/n));
    const innerWidth = (barWidth+barMargin)*n;
    let max = 0;
    if (opts.relative)
        max = 100;
    else
        for(let j=0;j<allBars.length;j++){
            let bars = allBars[j];
            for(let i=0;i<n;i++){
                if (opts.ref !== undefined && opts.ref[i] > max)
                    max = opts.ref[i];
                if (bars[i] > max)
                    max = bars[i];
            }
        }

    let lastXTick;
    for(let i=0;i<n;i++){
        let x = leftMargin+i*(barWidth+barMargin);
        let width = barWidth+(x-Math.floor(x) > 0.5 && barMargin == 0 ? 1 : 0)+"px";
        if (opts.ref !== undefined){
            const refElement = document.createElement("span");
            refElement.style.width = width;
            if (opts.relative)
                refElement.style.height = plotHeight+"px";
            else
                refElement.style.height = Math.floor(opts.ref[i]/max*plotHeight)+"px";
    
            refElement.style.position = "absolute";
            refElement.style.left = x+"px";
            refElement.style.bottom = bottomMargin+"px";
            refElement.style.display = "block";
            refElement.className = "refbar";
            refElement.style.margin = barMargin+"px";
            container.appendChild(refElement);
        }
        if (i % (Math.floor(n/(nHorizonalTicks))) == 0){
            // we add a legend
            const legendElement = document.createElement("span");
            legendElement.style.position = "absolute";
            legendElement.style.display = "block";
            legendElement.style.textAlign = "center";
            legendElement.innerText = opts.xTicks !== undefined ? opts.xTicks[i] : i;
            const left = Math.floor(-(legendElement.clientWidth-barWidth)/2+leftMargin+i*(barWidth+barMargin));
            container.appendChild(legendElement);
            legendElement.style.left = Math.floor(left-legendElement.clientWidth/2)+"px";
            legendElement.style.bottom = (bottomMargin-legendElement.clientHeight)+"px";
            // if there's not enough space for a tick we remove it again...
            if (lastXTick !== undefined && (left-20) <= lastXTick)
                container.removeChild(legendElement);
            lastXTick = left+legendElement.clientWidth;
        }
        let y = 0;
        for(let j=0;j<allBars.length;j++){
            let bars = allBars[j];
            let className;
            if (opts.classNames !== undefined)
                className = opts.classNames[j];
            let h = bars[i];
            let ref = (opts.relative ? opts.ref[i]: max);
            let hh = Math.ceil(h/ref*plotHeight);
            let yy = Math.floor(y/ref*plotHeight);
            if (hh+yy > plotHeight)
                hh -= hh+yy-plotHeight;
            const element = document.createElement("span");
            element.style.marginLeft = -(barWidth+barMargin)+"px";
            element.style.width = width;
            element.style.height = hh+"px";
            element.style.position = "absolute";
            element.style.left = x+"px";
            element.style.bottom = (bottomMargin+yy)+"px";
            element.style.display = "block";
            element.style.zIndex = 2;
            element.className = "bar";
            if (className !== undefined)
                element.className += " "+className;
            element.style.margin = barMargin+"px";
            container.appendChild(element);
            y += h;
        }
    }
    const nVerticalTicks = max > 0 ? 5 : 0;
    for(let i=1;i<nVerticalTicks+1;i++){
        const y = i/nVerticalTicks*max;
        const lv = Math.floor(Math.log10(y));
        const v = Math.round(y/Math.pow(10,lv))*Math.pow(10, lv);
        const ly = (bottomMargin+v/max*plotHeight);
        const legendElement = document.createElement("span");
        legendElement.style.position = "absolute";
        legendElement.style.horizontalAnchor = "right";
        legendElement.style.display = "block";
        legendElement.innerText = formatNumber(v);
        container.appendChild(legendElement);

        legendElement.style.left = (leftMargin-legendElement.clientWidth-2)+"px";
        legendElement.style.bottom = ly-legendElement.clientHeight/3+"px";

        const gridElement = document.createElement("span");
        gridElement.style.position = "absolute";
        gridElement.style.display = "inline-block";
        gridElement.style.left = leftMargin;
        gridElement.style.bottom = ly+"px";
        gridElement.style.width = innerWidth+"px";
        gridElement.style.height = "1px";
        gridElement.style.borderTop = "#aaa dashed 1px";
        gridElement.style.zIndex = 1;

        container.appendChild(gridElement);
    }
}

// https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
function formatNumber(x) {
    const o = Math.floor(Math.log10(x))
    if (o >= 6) {
        return (Math.round(x/Math.pow(10, 6)*10)/10.0)+"M";
    } else if (o >= 3) {
        return (Math.round(x/Math.pow(10, 3)*10)/10.0)+"k";
    }
    return x;
}
function updateNumbers(){

    const totalSickT = getTotalSick();
    const totalHealthyT = getTotalHealthy();
    const totalCuredT = getTotalCured();
    const totalDeceasedT = getTotalDeceased();

    totalSick.push(totalSickT);
    totalHealthy.push(totalHealthyT);
    totalCured.push(totalCuredT);
    totalDeceased.push(totalDeceasedT);

    if (newInfections.length == 0)
        newInfections.push(totalInfections);
    else{
        let allInfections = 0;
        for(let i=0;i<newInfections.length;i++)
            allInfections += newInfections[i];
        newInfections.push(totalInfections-allInfections);
    }

    const d = new Date()
    d.setDate(d.getDate()+t);
    dates.push(d.toLocaleDateString());

    const totalSickElem = document.getElementById("totalSick");
    totalSickElem.innerText = formatNumber(totalSickT);

    const totalHealthyElem = document.getElementById("totalHealthy");
    totalHealthyElem.innerText = formatNumber(totalHealthyT);

    const totalCuredElem = document.getElementById("totalCured");
    totalCuredElem.innerText = formatNumber(totalCuredT);

    const totalDeceasedElem = document.getElementById("totalDeceased");
    totalDeceasedElem.innerText = formatNumber(totalDeceasedT);

    const dayElem = document.getElementById("day");
    dayElem.innerText = t;
}

function plot(){
    updateNumbers();
    barChart("healthy", [totalHealthy], {xTicks: dates});
    barChart("sick", [totalSick], {xTicks: dates});
    barChart("newInfections", [newInfections], {xTicks: dates});
    barChart("cured", [totalCured], {xTicks: dates});
    barChart("deceased", [totalDeceased], {xTicks: dates});
    barChart("deceasedCohortsAbsolute", [deceasedCohorts]);
    barChart("sickCohortsAbsolute", [allSickCohorts]);
    barChart("mortality", [mortality], {});
    barChart("ageCohorts", [allCohorts], {});
    barChart("relativeCohorts", [healthyCohorts, curedCohorts, allSickCohorts, deceasedCohorts], {classNames: ["healthy", "cured", "sick", "deceased"], ref: allCohorts, relative: true});
}

function evolveAndPlot(){
    stopped = false;
    if (!paused){
        evolve();
        plot();
        t++;
    }
    if (t < 200)
        setTimeout(evolveAndPlot, 200);
    else
        stopped = true;
}

function onLoad(){
    initialize();
    plot();
    if (stopped)
        evolveAndPlot();
    const pauseButton = document.getElementById("pause");
    pauseButton.addEventListener("click", pause);
    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", reset);
    const rateInput = document.getElementById("rate");
    rateInput.value = infectionRate;
    rateInput.addEventListener("input", onRateChange);

    const initialSickInput = document.getElementById("initialSick");
    initialSickInput.value = initialSick;
    initialSickInput.addEventListener("input", onInitialSickChange);

    const sicknessDurtionInput = document.getElementById("sicknessDuration");
    sicknessDurtionInput.value = sicknessDuration;
    sicknessDurtionInput.addEventListener("input", onSicknessDurationChange);

    barChart("mortality", mortality);
}

function reset(){
    initialize();
    plot();
    if (stopped)
        evolveAndPlot();
}

function pause(){
    paused = !paused;
    const pauseButton = document.getElementById("pause");
    if (paused){
        pauseButton.innerHTML = "continue";
        pauseButton.className = "paused";
    }
    else{
        pauseButton.innerHTML = "pause";
        pauseButton.className = "";
    }
}

function onRateChange(e){
    const newInfectionRate = parseFloat(e.target.value);
    if (newInfectionRate === newInfectionRate) {
        infectionRate = newInfectionRate;
        updateInfectionRate();
    }
}

function onSicknessDurationChange(e){
    const newDuration = parseInt(e.target.value);
    if (newDuration === newDuration) {
        sicknessDuration = newDuration;
        reset();
    }
}

function onInitialSickChange(e){
    const newInitialSick = parseInt(e.target.value);
    if (newInitialSick === newInitialSick) {
        initialSick = newInitialSick;
        reset();
    }

}

window.addEventListener("load", onLoad, false);

