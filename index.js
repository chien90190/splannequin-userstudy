function prevPage() {
    // Add functionality for previous page
    console.log('Previous page');
    changePage(now)
    now -= 1;
    renderObjects(now);
    resetRadioStatus(now);
}

function nextPage() {
    // Add functionality for next page
    console.log('Next page');
    if (changePage(now)) {
        if(now === data_list.length-1) {
            MySubmit = form_url;
            MySubmit += `${username_entry}=` + data_list[0]["username"] + "&";
            
            for(let i=1; i<data_list.length; i++) {
                for(let q = 1; q <= num_of_questions; q++) {
                    MySubmit += entry_list[i-1][q-1] + "=" + data_list[i][`Q${q}`] + "&";
                };
            }

            MySubmit += "submit=Submit";
            window.location.replace(MySubmit);
        } else {
            now += 1;
            renderObjects(now);
            resetRadioStatus(now);
        }
        
    } else {
        alert("Cannot be empty!!!! 選項尚未選完");
    }
}

function changePage(now) {
    if (now == 0) {
        username = document.getElementById("username");
        if (username.value == "") {
            return false;
        }
        data_list[0]['username'] = username.value;
        console.log(data_list[0]['username'])
        return true;
    }

    let query_checked = true

    for(let q = 1; q <= num_of_questions; q++) {
        let query = document.querySelector(`input[name="Q${q}"]:checked`);
        if (query == null) {
            query_checked = false;
        } else {
            data_list[now][`Q${q}`] = data_list[now]['data'][parseInt(query.value)-1]['value'] 
        }
    }

    return query_checked
}

function resetRadioStatus(now) {
    for(let q = 1; q <= num_of_questions; q++) {
        for(let v = 1; v <= num_of_selection; v++) {
            document.getElementById(`q${q}v${v}`).checked = false;
        }

        for(let v = 1; v <= num_of_selection; v++) {
            if(data_list[now][`Q${q}`] === data_list[now]['data'][v-1]['value']) {
                document.getElementById(`q${q}v${v}`).checked = true;
                break;
            }
        }
    }
}

function shuffle(array) {
    let currentIndex = array.length;

    while (currentIndex != 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function generateElements(data, width, type) {
    if(type === "video") {
        const uniqueId = 'video_' + Math.random().toString(36).substr(2, 9);
        return `
            <video id="${uniqueId}" class="sync-video" width="${width}" controls preload="auto"
            onplay="syncOtherVideos(this)" 
            onseeked="syncOtherVideoTime(this)"
            onloadedmetadata="console.log('Video metadata loaded', this.id)">
                <source src="${data}" type="video/mp4" />
            </video>
        `;
    }
    else if(type === "image") {
        return `
            <img src="${data}" width="${width}"/>
        `;
    }
}

// Functions to control videos
function getAllVideos() {
    return document.querySelectorAll('video');
}

function playAllVideos() {
    const videos = getAllVideos();
    videos.forEach(video => {
        // Check if video is ready to play
        if (video.readyState >= 2) { 
            video.play().catch(err => {
                console.error('Error playing video:', err);
            });
        } else {
            // If not ready, wait for it to be ready
            video.addEventListener('canplay', function playOnceReady() {
                video.play().catch(err => {
                    console.error('Error playing video:', err);
                });
                video.removeEventListener('canplay', playOnceReady);
            });
        }
    });
}

function pauseAllVideos() {
    const videos = getAllVideos();
    videos.forEach(video => {
        video.pause();
    });
}

function jumpToTime(percentage) {
    const videos = getAllVideos();
    
    // Disable event listeners temporarily to prevent feedback loops
    videos.forEach(video => {
        video.onpause = null;
        video.onseeked = null;
        video.onplay = null;
    });
    
    // Set all videos to the same time point
    videos.forEach(video => {
        // Only set time if duration is available
        if (video.readyState >= 1 && !isNaN(video.duration)) {
            const targetTime = video.duration * percentage;
            video.currentTime = targetTime;
            video.pause();
        } else {
            // If duration not available, wait for metadata
            video.addEventListener('loadedmetadata', function setTimeOnceReady() {
                const targetTime = video.duration * percentage;
                video.currentTime = targetTime;
                video.pause();
                video.removeEventListener('loadedmetadata', setTimeOnceReady);
            });
        }
    });
    
    // Re-enable synchronization after a short delay
    setTimeout(() => {
        initVideoSynchronization();
    }, 500);
}

// Add these functions to sync videos
function syncOtherVideos(currentVideo) {
    // Get all videos except the current one
    const videos = Array.from(getAllVideos()).filter(v => v !== currentVideo);
    
    // Only try to sync if the current video is the one that initiated the action
    if (document.activeElement === currentVideo) {
        videos.forEach(video => {
            if (video.paused) {
                video.currentTime = currentVideo.currentTime;
                // Use a flag to prevent infinite loops of event handlers
                video._ignoreNextPlay = true;
                video.play().catch(() => {});
            }
        });
    }
}

function syncOtherVideoTime(currentVideo) {
    // Get all videos except the current one
    const videos = Array.from(getAllVideos()).filter(v => v !== currentVideo);
    
    // Only try to sync if the current video is the one that initiated the action
    if (document.activeElement === currentVideo) {
        videos.forEach(video => {
            // Use a flag to prevent infinite loops
            if (!video._ignoreNextSeek) {
                video._ignoreNextSeek = true;
                video.currentTime = currentVideo.currentTime;
                // Reset the flag after a short delay
                setTimeout(() => { video._ignoreNextSeek = false; }, 100);
            }
        });
    }
}

// Add this function to your JavaScript and call it at the appropriate time
function initVideoSynchronization() {
    console.log('Initializing video synchronization');
    const videos = getAllVideos();
    
    // Remove existing event listeners to prevent duplication
    videos.forEach(video => {
        video.onplay = null;
        video.onseeked = null;
        video.onpause = null;
    });
    
    // Add fresh event listeners
    videos.forEach(video => {
        video.addEventListener('play', function() {
            if (!this._ignoreNextPlay) {
                syncOtherVideos(this);
            }
            this._ignoreNextPlay = false;
        });
        
        video.addEventListener('seeked', function() {
            if (!this._ignoreNextSeek) {
                syncOtherVideoTime(this);
            }
        });
    });
}


function renderObjects(now) {
    if(now == 0) {
        // Username page
        let txt = `
            <br><br><br><br><br><br>
            <h1>User Study</h1>
            <form style="text-align: center;" align="center">
                <fieldset>
                    <legend>Anonymous Username 匿名名字</legend>
                    <input type="text" id="username" value="">
                </fieldset>
            </form>
        `;
        document.getElementById("images").innerHTML = txt;
        document.getElementById("num_page").innerHTML = ``; // Clear the page number
    } else {
        // Control buttons for videos
        let controlButtons = `
            <div class="group-controls" style="display: flex; justify-content: center; margin-bottom: 15px; gap: 10px;">
                <button class="btn" onclick="playAllVideos()" style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 3px;">Start All</button>
                <button class="btn" onclick="pauseAllVideos()" style="padding: 5px 10px; background-color: #6c757d; color: white; border: none; border-radius: 3px;">Stop All</button>
                <span class="time-controls" style="display: flex; align-items: center; margin-left: 15px;">
                    <span style="font-weight: bold; margin-right: 5px;">Jump to:</span>
                    <button class="btn" onclick="jumpToTime(0)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">0%</button>
                    <button class="btn" onclick="jumpToTime(0.25)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">25%</button>
                    <button class="btn" onclick="jumpToTime(0.5)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">50%</button>
                    <button class="btn" onclick="jumpToTime(0.75)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">75%</button>
                    <button class="btn" onclick="jumpToTime(1.0)" style="padding: 3px 8px; margin: 0 2px; background-color: #17a2b8; color: white; border: none; border-radius: 3px;">100%</button>
                </span>
            </div>
        `;
        
        // Create video rows
        let firstRowVideos = "";
        let secondRowVideos = "";
        
        // First row - videos 1 and 2
        for(let i = 0; i < Math.min(2, num_of_selection); i++){
            firstRowVideos += `
                <div class="input-object" style="width: ${obj_width}px;">
                    ${generateElements(data_list[now]['data'][i]['url'], obj_width, element_type)}
                    <div class="titles">${obj_title} ${i+1}</div>
                </div>
            `;
        }
        
        // Second row - videos 3 and 4 (if they exist)
        for(let i = 2; i < num_of_selection; i++){
            secondRowVideos += `
                <div class="input-object" style="width: ${obj_width}px;">
                    ${generateElements(data_list[now]['data'][i]['url'], obj_width, element_type)}
                    <div class="titles">${obj_title} ${i+1}</div>
                </div>
            `;
        }

        let txt = `
            <div>
                ${controlButtons}
                <div class="video-row" style="margin-bottom: 20px;">
                    ${firstRowVideos}
                </div>
                <div class="video-row">
                    ${secondRowVideos}
                </div>
            </div>
        `;

        document.getElementById("images").innerHTML = txt;
        document.getElementById("num_page").innerHTML = `${now}/${data_list.length-1}`;
        
        // Initialize video sync after a short delay
        setTimeout(initVideoSynchronization, 100);
    }
    
    // Set up the question section
    document.getElementById("text_prompt").innerHTML = `Questions`;
    renderQuestions();
    
    // Control visibility of elements based on current page
    if(now == 0) {
        document.getElementById("question").style.visibility = "hidden";
        // Hide page number on the username page
        document.getElementById("num_page").style.visibility = "hidden";
    } else {
        document.getElementById("question").style.visibility = "visible";
        document.getElementById("num_page").style.visibility = "visible";
    }

    if(now == 0 || now == 1) {
        document.getElementById("prev_button").style.visibility = "hidden";
    } else {
        document.getElementById("prev_button").style.visibility = "visible";
    }

    if(now == data_list.length-1) {
        document.getElementById("next_button").innerHTML = `SUBMIT`;
    } else {
        document.getElementById("next_button").innerHTML = `NEXT`;
    }
}


function renderQuestions() {
    let txt = `<div style="margin: 0; padding: 0;">`; // Container with no extra margins

    for(let q = 1; q <= num_of_questions; q++) {
        txt += `
        <div style="margin-bottom: 10px;"> <!-- Reduced space between questions -->
            <p style="margin: 0 0 5px 0; font-weight: bold;">Q${q}. ${questions[q-1]}</p> <!-- Reduced bottom margin, added bold -->
            <div style="display: flex; align-items: center; flex-wrap: wrap;">`; // Arrange options horizontally

        for(let v = 1; v <= num_of_selection; v++){
            txt +=`
                <div style="margin-right: 15px; display: flex; align-items: center;"> <!-- Group radio + label with spacing -->
                    <input type="radio" id="q${q}v${v}" name="Q${q}" value="${v}" class="radio-container" style="margin: 0 5px 0 0;"/>
                    <label for="q${q}v${v}" style="margin: 0;">${v}</label>
                </div>
            `;
        } 

        txt +=`
            </div>
        </div>
        `;
    }
    
    txt += `</div>`;
    document.getElementById("questions").innerHTML = txt;
}
