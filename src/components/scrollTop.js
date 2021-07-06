export function scrollTop(step) {
    var start = window.pageYOffset;
    var count = 0;
    var intervalRef = setInterval( (function(interval, curOffset) {
        return function() {
            curOffset -= (interval * step);
            console.info("offset = " + curOffset);
            window.scrollTo(0, curOffset);
            console.info("pageYoffset = " + window.pageYOffset);
            count++;
            if(count > 150 || curOffset < 0) clearInterval(intervalRef);
        }
    })(step, start--), 50);
}