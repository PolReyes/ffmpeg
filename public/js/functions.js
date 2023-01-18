'use strict'

window.addEventListener('load', function () {
    var select = document.querySelector("#option");
    var i = "";
    var input = document.querySelector("#input");

    select.addEventListener('change', function (e) {
        e.preventDefault();
        input.innerHTML = '';
        for (i = 0; i < select.value; i++) {
            createInputs();
        }
    });

    function createInputs() {
        var element = document.createElement('div');
        element.innerHTML = `
    <div class="form-group">
        <p>${i + 1}</p>
        <input type="text" name="duration${i}" class="" value="00:00" />
    </div>
    `;
        input.appendChild(element);
    }
});