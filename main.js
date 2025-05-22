$(document).ready(function () {
    //Initialize windows and hide
    $(".window").draggable({ containment: "body", scroll: false, handle: ".titlebar" }); //drag function
    $("#page1").load("testpage.html");
    $(".window").hide();

    //debug parameter
    $(".window").show();

    //*******JSONS STORY AND PROGRESSION DATA*************************//

    //tracking progression of story
    let storyState = {
        day: 1,
        step: 0,
        alignment: { //track affinity with factions
            alitech: 0,
            pyrrhit: 0,
            friend: 0
        },
        flags: { //flags for completing specific tasks
            finishedTutorial: false,
            testFlag1: true,
            testFlag2: false,
            testFlag3: false
        }
    };

    const storyDays = {
        // dialogue -> load dialogue
        // window -> open a window
        // minigame -> initialize minigame
        testDay: [
            { action: "dialogue", id: "testDialogue" },
            { action: "dialogue", id: "DialogueOne" }
        ],
        10: [
            { action: "dialogue", id: "day10_intro" },
            { action: "minigame", id: "hackingGame" },
            { action: "dialogue", id: "day10_outro" }
        ],
        20: [
            { action: "dialogue", id: "day20_intro" },
            {
                action: "branch",
                condition: "alignment",
                check: "pyrrhit",
                goto: "day20_pyrrhit"
            },
            { action: "dialogue", id: "day20_alitech" }
        ],

        day20_pyrrhit: [
            { action: "dialogue", id: "day20_rebel_intro" },
            { action: "minigame", id: "infiltration" }
        ]
    };

    //*******STORY PROGRESSION FUNCTION*************************//
    function continueDay() {
        const steps = storyDays[storyState.day];
        if (!steps || storyState.step >= steps.length) return;

        const current = steps[storyState.step];

        switch (current.action) {
            case "dialogue":
                loadDialogues(current.id);
                return;

            case "minigame":
                launchMinigame(current.id);
                return;

            case "branch": {
                const score = storyState.alignment[current.check];
                if (score >= current.min) {
                    // jump to branch sequence
                    storyState.day = current.goto;
                    storyState.step = 0;
                    continueDay();
                    return;
                } else {
                    storyState.step++;
                    continueDay();
                    return;
                }
            }
        }
    }

    //*******DIALOGUE FUNCTION*************************//

    //init dialogue variables
    let currentDialogue = [];
    let currentResponses = [];
    let dialogueBranches = {};
    let dialogueProgress = 0;
    let responseDelay = 1000; //1000 milliseconds
    let dialogueComplete = false; //marker if current dialogue is finished or not


    //dialogue texts object
    const dialogue = {
        testDialogue: {
            //All dialogue lines
            lines: [
                "this is first msg",                 // 0
                "bad or good?",                      // 1
                "good. very good.",                  // 2
                "very bad not good",                 // 3
                "enough talking this is just a test" // 4
            ],
            responses: [
                null,
                ["good", "bad"],
                null,
                null,
                null
            ],
            //Assign branches to skip dialogues when reaching a certain message.
            //Objects following dialogue options, and numbers for normal messages.
            branches: {
                1: { "good": 2, "bad": 3 }, //good chosen -> 2, bad -> 3
                2: 4,                       //After 2, -> 4
                3: 4                        //3 -> 4
            },
            user: "Tester Yoon"
        },

        DialogueOne: {
            //All dialogue lines
            lines: [
                "this is first msg",                 // 0
                "bad or good?",                      // 1 
                "good. very good.",                  // 2
                "very bad not good",                 // 3
                "enough talking this is just a test" // 4
            ],
            responses: [
                null,
                null,
                null,
                null,
                null
            ],
            //Assign branches to skip dialogues when reaching a certain message.
            //Objects following dialogue options, and numbers for normal messages.
            branches: {
                1: { "good": 2, "bad": 3 }, //good chosen -> 2, bad -> 3
                2: 4,                       //After 2, -> 4
                3: 4                        //3 -> 4
            }
        }
    };

    //load dialogue as current
    function loadDialogues(dialogueName) {
        const dlg = dialogue[dialogueName];
        currentDialogue = dlg.lines;
        currentResponses = dlg.responses;
        dialogueBranches = dlg.branches || {}; //optional if it has branches
        dialogueProgress = 0;

        showNextLine();
    }

    //Incrementing dialogue
    function showNextLine() {
        const line = currentDialogue[dialogueProgress];
        const response = currentResponses[dialogueProgress];

        $("#chatwindow").append(`<div class="chatmsg npcline">${line}</div>`); //add line to chatwindow

        if (Array.isArray(response)) { //if response exists for the line
            //show choices
            $("#chatwindow").append(`<div id="replybox"></div>`);
            response.forEach(option => {
                $("#replybox").append(`<button class="responseoption">${option}</button>`);
            });

            //clicked option
            $(".responseoption").click(function () {
                const choiceText = $(this).text();
                $("#replybox").remove();
                $("#chatwindow").append(`<div class="chatmsg playerline">${choiceText}</div>`);

                //check branch and goto line
                dialogueProgress = dialogueBranches[dialogueProgress][choiceText];
                setTimeout(showNextLine, responseDelay);
            });

        } else {
            //if a skip is defined in branches, skip to assigned number
            if (typeof dialogueBranches[dialogueProgress] === "number") {
                dialogueProgress = dialogueBranches[dialogueProgress];
            } else {
                dialogueProgress++;
            }
            //show next line if not at end
            if (dialogueProgress < currentDialogue.length) {
                setTimeout(showNextLine, responseDelay);
            }
        }
    }

    //load test
    loadDialogues("testDialogue");

    //*******DESKTOP WINDOWS FUNCTION*************************//

    //Array to keep windows in order of last interacted with
    let windows = $(".window").toArray(); //array objects are stored as raw DOMs
    let windowIndexRange = 50; //z index range for windows starts at

    //rearrange windows when clicked
    $(".window").mousedown(function () {
        bringToFront(this);
    });

    //bring active window to end of array
    function bringToFront(interactedWindow) {
        windows = windows.filter(a => a !== interactedWindow);
        windows.push(interactedWindow);
        for (let i = 0; i < windows.length; i++) {
            //console.log(i + " " + $(windows[i]).prop('id'));
            $(windows[i]).css("z-index", i + windowIndexRange);
        }
        $(".titlebar").removeClass("activetitlebar");
        $(interactedWindow).find(".titlebar").addClass("activetitlebar");
    }

    //taskbar functionality
    $(".taskbutton").click(function () {
        const buttonId = $(this).attr("id"); // id of button (taskbutton)
        const windowEl = $("#" + buttonId.replace("button", "window"))[0]; //parse buttonId to get corresponding window (raw dom)

        if ($(windowEl).is(":visible")) {
            // if ($(windowEl).find(".titlebar").hasClass("activetitlebar")) { //if active window minimize
            minimizeWindow(windowEl);
        } else { //or show hidden window
            maximizeWindow(windowEl);
        }
    });

    //functions for handling open and close windows
    function minimizeWindow(cWin) {
        const windowId = $(cWin).attr("id"); // id of window
        const buttonEl = $("#" + windowId.replace("window", "button"))[0]; //parse window -> button id
        //hide window and deactivate button
        $(cWin).hide();
        $(buttonEl).removeClass("activetaskbutton");
    }
    function maximizeWindow(mWin) {
        const windowId = $(mWin).attr("id"); // id of window
        const buttonEl = $("#" + windowId.replace("window", "button"))[0]; //parse window -> button id

        $(mWin).show();
        $(buttonEl).addClass("activetaskbutton");
        bringToFront(mWin);
    }

    //closebutton
    $(".closebutton").on("click", function () {
        minimizeWindow($(this).closest(".window"));
    });

    //*******CORRUPTION WINDOW*************************//
    
    //Corruption indicator
    //init grid shape
    for (let i = 0; i < 20; i++) {
        $(".sectorstatusbg").append(`<div class='sectorind sectorindb' style='grid-area: ${i + 1} / 1 / ${i + 2} / 2' value='${i+1}'></div>`);
    }

    //displaying corruption progress
    function corruptionProgress(corruptval) {
        for (const sector of document.getElementsByClassName("sectorind")) {
            $(sector).removeClass("corruptsector");
            $(sector).removeClass("corruptingsector");
            if ($(sector).attr('value') == corruptval) {
                $(sector).addClass("corruptingsector");
            }
            else if ($(sector).attr('value') > corruptval) {
                $(sector).addClass("corruptsector");
            }
        }
    }
    // 21 = no corruption 0 = max corruption
    let corruptValue = 21;

    //test function for corruption increments
    $("#sectorstatus").mousedown( function() {
        corruptValue--;
        corruptionProgress(corruptValue);
    });
});