window.addEventListener('load', () => {
 
  // arreglo de elementos
  //var elements = JSON.parse(localStorage.getItem('elements') || '[]');
  // filtro actual
  //var filter = localStorage.getItem('filter') || false;
  var elements = [];
  var filter = false;

  fetch('/api/task')
    .then(res => res.json())
    .then(({ message, todos }) => {
      elements = todos;
      render();
    });

  var timeMachine = [];
  window.timeMachine = timeMachine;

  var itemsLeft;

  // render inicial de la aplicación
  render();

  function render(){
    // calcular elementos restantes
    itemsLeft = elements.reduce((prev, { checked }) => !checked ? prev + 1 : prev, 0);
    // calcular elementos completados
    const itemsCompleted = elements.length - itemsLeft;

    // seleccionar #app y setear contenido
    const app = document.querySelector('#app');
    app.innerHTML = `
      <div class="card-body">
        <header class="form-group mb-0">
          <label>Nueva Tarea</label> <button ${elements.length > 0 ? '' : 'hidden'}>${itemsLeft === 0 ? 'Restaurar' : 'Completar'} todos</button>
          <input type="text" class="form-control w-100" placeholder="Escribe la siguiente tarea">
        </header>

        <section class="list-group mt-4" ${elements.length > 0 ? '' : 'hidden'}></section>

        <footer class="mt-4 justify-content-between align-items-center ${elements.length > 0 ? 'd-flex' : 'd-none'}">
          <small>${itemsLeft} elemento${itemsLeft === 1 ? '' : 's'} restante${itemsLeft === 1 ? '' : 's'}</small>
          <div class="filters">
            <button class="btn btn-sm btn-outline-secondary">Todos</button>
            <button class="btn btn-sm btn-outline-secondary">Completados</button>
            <button class="btn btn-sm btn-outline-secondary">Restantes</button>
          </div>
          <a href="#" ${itemsCompleted > 0 ? '' : 'hidden'}>Borrar completados</a>
        </footer>
      </div>
    `;

    // seleccionar input
    const input = app.querySelector('input');
    // auto-enfocar input
    input.focus();
    // evento del input
    input.addEventListener('keydown', handleInput);

    // filtrar lista
    var elementsFiltered = elements.filter(({ checked }) => {
      switch(filter){
        case 'completed': return checked;
        case 'uncompleted': return !checked;
        default: return true;
      }
    });
    // seleccionar lista de tareas
    const list = app.querySelector('.list-group');
    // llenar lista de tareas
    list.append(...elementsFiltered.map(getTask));

    // setear filters
    setFilters(...app.querySelectorAll('.filters .btn'));

    // botón borrar completados
    app.querySelector('footer a').addEventListener('click', deleteCompleted);

    // acción botón completar todos
    app.querySelector('button').addEventListener('click', completeAll);

    // guardar datos en localStorage
    localStorage.setItem('elements', JSON.stringify(elements));
    localStorage.setItem('filter', filter);

    timeMachine.push({
        elements: [ ...elements ],
        filter
    });
  }

  window.addEventListener('keydown', ({ key, ctrlKey }) => {
    if(key === 'z' && ctrlKey){
        var [ snap ] = timeMachine.splice(-2, 2);
        elements = snap.elements;
        filter = snap.filter;
        render();
    }
  });

  function completeAll(){
      elements.forEach(element => {
          if(itemsLeft === 0){
            element.checked = false;
          } else {
            element.checked = true;
          }
          //element.checked = itemsLeft !== 0;
      });
      render();
  }

  // cuando el usuario oprime enter crea el nuevo elemento
  function handleInput({ keyCode, target: { value } }) {
    if(keyCode === 13 && value){
      elements.push({
        text: value,
        checked: false,
      });

      var body = new URLSearchParams();
      body.append('text', value);
      fetch('/api/task', {
        method: 'POST',
        body: body,
      })
      .then(res => res.json())
      .then(res => {
        console.log(res);
      });

      render();
    }
  }

  // eliminar todos los elementos completados
  function deleteCompleted(){
    elements = elements.filter(({ checked }) => !checked);
    render();
  }

  // setear la variable filter
  function setFilters(all, completed, uncompleted) {
    all.addEventListener('click', () => {
      filter = false;
      render();
    });
    completed.addEventListener('click', () => {
      filter = 'completed';
      render();
    });
    uncompleted.addEventListener('click', () => {
      filter = 'uncompleted';
      render();
    });
  }

  // crear un elemento tarea
  function getTask(elem, index) {
    const { text, checked } = elem;
    var item = document.createElement('div');
    item.setAttribute('class', 'list-group-item');
    item.innerHTML = `
      <input type="checkbox" ${checked ? 'checked' : ''} />
      <label style="text-decoration: ${checked ? 'line-through' : 'none'}">
        ${text}
      </label>
      <button class="close text-danger">
        <span>&times;</span>
      </button>
    `;
    // reaccionar al click del checkbox
    var input = item.querySelector('input')
    input.addEventListener('click', (e) => {
      elem.checked = e.target.checked;

      var body = new URLSearchParams();
      body.append('checked', elem.checked);
      fetch(`/api/task/${index}`, {
        method: 'PUT',
        body: body,
      })
      .then(res => res.json())
      .then(res => {
        console.log(res);
      });

      render();
    });
    // eliminar el elemento al dar click en el botón de la x
    item.querySelector('.close').addEventListener('click', (e) => {
      elements.splice(index, 1);
      render();
    });
    // seleccionar label
    var label = item.querySelector('label');
    // hacer el label editable al hacer doble click
    label.addEventListener('dblclick', (e) => {
      label.setAttribute('contenteditable', true);
    });
    // setear el nuevo contenido al oprimir enter
    label.addEventListener('keydown', (e) => {
      if(e.keyCode === 13){
        elem.text = label.innerText;
        render();
      }
    });
    label.addEventListener('blur', (e) => {
        elem.text = label.innerText;
        render();
    });
    // retornar el elemento
    return item;
  }

});