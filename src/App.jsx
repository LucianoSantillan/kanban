import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = 'http://localhost:3000';

function App() {
  const [columns, setColumns] = useState({
    pending: { name: 'Pendientes', items: [] },
    inProgress: { name: 'En Proceso', items: [] },
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  // --- Funciones para interactuar con el Backend ---
  const fetchAllTasks = async () => {
    try {
      const [pendingResponse, inProgressResponse] = await Promise.all([
        fetch(`${API_URL}/tasks?status=pending&limit=100`),
        fetch(`${API_URL}/tasks?status=inProgress&limit=100`)
      ]);
      const pendingData = await pendingResponse.json();
      const inProgressData = await inProgressResponse.json();
      setColumns({
        pending: { name: 'Pendientes', items: pendingData.tasks },
        inProgress: { name: 'En Proceso', items: inProgressData.tasks },
      });
    } catch (error) {
      console.error("No se pudieron cargar las tareas. Revisa que el backend esté funcionando.", error);
    }
  };

  const updateTaskOnServer = async (taskId, dataToUpdate) => {
    try {
      await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate),
      });
    } catch (error) {
      console.error("Error al actualizar la tarea.", error);
    }
  };

  const addTaskOnServer = async (text) => {
    try {
      await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
    } catch (error) {
      console.error("Error al crear la tarea.", error);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, []);

// --- Función principal que se ejecuta al soltar una tarea ---
const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // 1. Si se suelta fuera de una columna, no hacer nada
    if (!destination) {
        return;
    }

    const startColumnId = source.droppableId;
    const endColumnId = destination.droppableId;

    const startColumn = columns[startColumnId];
    const endColumn = columns[endColumnId];

    // 2. Si se mueve dentro de la misma columna
    if (startColumn === endColumn) {
        const newItems = Array.from(startColumn.items);
        const [reorderedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, reorderedItem);

        // Actualizar el estado de esa columna
        const newColumn = { ...startColumn, items: newItems };
        setColumns({ ...columns, [startColumnId]: newColumn });

    } else { // 3. Si se mueve a una columna diferente
        const startItems = Array.from(startColumn.items);
        const [movedItem] = startItems.splice(source.index, 1);
        const endItems = Array.from(endColumn.items);
        endItems.splice(destination.index, 0, movedItem);

        // Actualizar el estado de ambas columnas
        setColumns({
            ...columns,
            [startColumnId]: { ...startColumn, items: startItems },
            [endColumnId]: { ...endColumn, items: endItems },
        });

        // Actualizar el estado en el backend para que el cambio sea permanente
        updateTaskOnServer(draggableId, { status: endColumnId });
    }
};

// --- Funciones para el Modal y Edición ---
const handleOpenModal = () => setIsModalOpen(true);

const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTaskText('');
};

const handleAddTask = async () => {
    if (newTaskText.trim() === '') return;
    await addTaskOnServer(newTaskText.trim());
    await fetchAllTasks();
    handleCloseModal();
};

const handleUpdateTask = async (taskId, currentText) => {
    const newText = prompt("Edita el texto de la tarea:", currentText);
    if (newText && newText.trim() !== '' && newText.trim() !== currentText) {
        await updateTaskOnServer(taskId, { text: newText.trim() });
        await fetchAllTasks();
    }
};

  return (
    <div className="app-container">
      <h1 className="main-title">Tablero Kanban (con React)</h1>
      <div className="kanban-board">
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([columnId, column]) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className="column-header">
                    <h2>{column.name}</h2>
                    {columnId === 'pending' && (
                      <button onClick={handleOpenModal} className="add-task-btn"><Plus size={20} /></button>
                    )}
                  </div>
                  <ul className="task-list">
                    {column.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                        {(provided) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="task-card"
                            onDoubleClick={() => handleUpdateTask(item.id, item.text)}
                          >
                            {item.text}
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Crear Nueva Tarea</h3>
            <input
              type="text"
              className="modal-input"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Descripción de la tarea..."
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={handleCloseModal} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleAddTask} className="btn btn-primary">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;