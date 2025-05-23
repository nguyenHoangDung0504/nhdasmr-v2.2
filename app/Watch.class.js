'use strict';

class Watch {
    static urlParams = new URLSearchParams(window.location.search);
    static trackKey = Watch.urlParams.get('code') || Watch.urlParams.get('rjcode');
    static track = Database.getTrackByIdentify(Watch.trackKey);
    static reuableElements = {
        contentDiv: document.querySelector('.content_div'),
        postBox: document.querySelector('.post-box'),
    }

    static build() {
        if (!Watch.track) {
            alert('Code not found!');
            window.history.back();
        }

        Watch.buildVidDiv();
        Watch.buildContentDiv();
        Watch.buildCloseMenuAction();

        fetch(`/descriptions/storage/${Watch.track.code}/vi.html`)
            .then(res => res.text())
            .then(html => {
                const container = document.getElementById('track-description');
                if (html.includes('desc-type'))
                    container.innerHTML = '<summary>Descriptions</summary>' + html;

                const scripts = container.querySelectorAll('script');
                scripts.forEach(s => {
                    console.log(s);
                    // container.removeChild(s);
                    container.appendChild(Object.assign(document.createElement('script'), { src: s.src }))
                });
            });
    }

    static buildVidDiv() {
        const { code, rjCode, cvs, tags, series, engName, japName, otherLinks } = Watch.track;
        const trackInfoContainer = document.querySelector('#track-info');
        const trackInfoRowsHtml = [];
        const vidFrame = document.querySelector('#vid_frame');

        vidFrame.src = `${window.location.href.includes('s2') ? '/s2' : ''}/watch/altplayer/?code=${code}`;
        vidFrame.addEventListener('focus', function () {
            document.addEventListener('touchmove', preventScroll, { passive: false });
        });
        vidFrame.addEventListener('blur', function () {
            document.removeEventListener('touchmove', preventScroll);
        });
        function preventScroll(e) {
            e.preventDefault();
        }

        document.querySelector('#download-box a').href = `${window.location.href.includes('s2') ? '/s2' : ''}/watch/download/?code=${code}`;
        trackInfoRowsHtml.push(`
            <span id="track_name">${rjCode ? `<b>Search code: </b>${rjCode}` : ''}
            ${japName ? `<br><br><b>Original name</b>: ${japName}` : ''}</span>
            <br><br><b>Translated name</b>: ${engName}`);
        if (otherLinks && otherLinks.length) {
            otherLinks.forEach(({ note, url }, index) => {
                trackInfoRowsHtml.push(`<span id="other_link_${index + 1}"><b>${note}: </b><a class="series" target="_blank" href="${url}">Here</a></span>`);
            });
        }
        if (series.length)
            trackInfoRowsHtml.push(`<span id="track_series"><b>Series: </b>${series.map(key => Database.getCategory(Database.categoryType.SERIES, key).getHtmlLink()).join(', ')}</span>`);
        trackInfoRowsHtml.push(`<span id="track_list_cv"><b>CVs</b>: ${cvs.map(key => Database.getCategory(Database.categoryType.CV, key).getHtmlLink()).join(', ')}</span>`);
        trackInfoRowsHtml.push(`<span id="track_list_tag"><b>Tags</b>: ${tags.map(key => Database.getCategory(Database.categoryType.TAG, key).getHtmlLink()).join(', ')}</span>`);
        trackInfoContainer.innerHTML = trackInfoRowsHtml.join('<br><br>');
    }

    static buildContentDiv() {
        localStorage.removeItem('shuffledIndexes');
        Watch.reuableElements.postBox.innerHTML = '';
        const { code, cvs } = Watch.track;
        const keyListToRandom = [...Database.trackKeyMap.values()].filter(key => key != code);
        const randomKeyList = Database.getRandomTracksKey(12, keyListToRandom);

        randomKeyList.filter(i => i).forEach(keyList => {
            Watch.reuableElements.postBox.appendChild(Database.trackMap.get(keyList).getPostBoxItem());
        });

        cvs.forEach(cv => {
            const cvKeylistToRandom = Database.getTracksKeyByCategory(Database.categoryType.CV, cv, keyListToRandom);
            let numberOfTrack = cvKeylistToRandom.length;

            if (numberOfTrack <= 0)
                return;

            localStorage.removeItem('shuffledIndexes');
            numberOfTrack = numberOfTrack <= 6 ? numberOfTrack : 6;
            const cvRandomKeyList = Database.getRandomTracksKey(numberOfTrack, cvKeylistToRandom);
            const newTitle = document.createElement('h2');
            const newPostBox = document.createElement('div');

            newTitle.innerHTML = `<h2>Random tracks by <a href="..?cv=${encodeURIComponent(cv)}"><span class="cv">${cv}</span></a></h2>`;
            newPostBox.classList.add('post-box');
            newPostBox.id = `CV - ${cv}`;

            Watch.reuableElements.contentDiv.appendChild(newTitle);
            Watch.reuableElements.contentDiv.appendChild(newPostBox);
            cvRandomKeyList.forEach(keyList => {
                newPostBox.appendChild(Database.trackMap.get(keyList).getPostBoxItem());
            });
        });
    }

    static buildCloseMenuAction() {
        document.querySelector('.close-menu').addEventListener('click', () => {
            Config.closeMenu();
        });
    }
}