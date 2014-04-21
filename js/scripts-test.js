var box;

function animate(){

    requestAnimationFrame(animate);
    box.tick();
}

function start(){
    animate();

}

$(function() {
    box = new ENCOM.Box({containerId: "box"});
    animate();

        
});



