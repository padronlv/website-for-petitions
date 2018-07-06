(function() {
    var canv = $('canvas');
    var ctxCanv =  canv[0].getContext('2d');
    let dataURL;
    ctxCanv.strokeStyle = '#990000';



    canv.on('mousedown.md', function(e) {
        e.preventDefault();
        console.log('mousedown!');
        ctxCanv.beginPath();
        ctxCanv.moveTo(e.offsetX, e.offsetY);
        canv.on("mousemove.mm", function(e) {
            e.preventDefault();
            console.log('mousemove!');
            ctxCanv.lineTo(e.offsetX, e.offsetY);
            ctxCanv.stroke();
        });

        canv.on('mouseup.mu', function(e) {
            e.preventDefault();
            console.log('mouseup!');
            canv.off('mousemove.mm');
            canv.off('mouseup.mu');
            dataURL = canv[0].toDataURL();
            console.log(dataURL);
            $('#signature').val(dataURL);
        });
    });




    // .on('click.removeAfterFirstClick', function(e) {
    //     $(e.currentTarget).off('.removeAfterFirstClick'); //removes all events in the removeAfterFirstClick namespace
    // });




    // ctxB.drawImage(canv, X, Y);
    //
    // document.addEventListener("keydown", function(e) {
    //     e.preventDefault();
    //     if (e.keyCode == 37) {
    //         X--;
    //         console.log(X);
    //
    //     } else if (e.keyCode == 38) {
    //         Y--;
    //
    //     } else if (e.keyCode == 39) {
    //         X++;
    //     } else if (e.keyCode == 40) {
    //         Y++;
    //     }
    //     ctxB.clearRect(0, 0, bigBoy.width, bigBoy.height);
    //     ctxB.drawImage(canv, X, Y);
    // });
})();
