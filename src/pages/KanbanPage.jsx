import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = 'http://localhost:3000';

// Configuración de las 6 columnas
const columnConfig = {
  'To do': { name: 'To Do' },
  'blocked': { name: 'Blocked' },
  'In progress': { name: 'In Progress' },
  'Ready for review': { name: 'Ready for Review' },
  'NO QA': { name: 'NO QA' },
  'READY FOR TESTING': { name: 'Ready for Testing' },
  'DONE': { name: 'Done' },
};

const firstColumnId = Object.keys(columnConfig)[0];

function KanbanPage() {
  const [columns, setColumns] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const fetchAllTasks = async () => {
    try {
      const newColumns = {};
      for (const status in columnConfig) {
        const response = await fetch(`${API_URL}/tasks?status=${status}&limit=100`);
        const data = await response.json();
        newColumns[status] = { name: columnConfig[status].name, items: data.tasks || [] };
      }
      setColumns(newColumns);
    } catch (error) {
      console.error("Error al cargar tareas. Revisa que el backend esté funcionando.", error);
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

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const startColumnId = source.droppableId;
    const endColumnId = destination.droppableId;
    const startColumn = columns[startColumnId];
    const endColumn = columns[endColumnId];

    if (startColumn === endColumn) {
      const newItems = Array.from(startColumn.items);
      const [reorderedItem] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, reorderedItem);
      setColumns({ ...columns, [startColumnId]: { ...startColumn, items: newItems } });
    } else {
      const startItems = Array.from(startColumn.items);
      const [movedItem] = startItems.splice(source.index, 1);
      const endItems = Array.from(endColumn.items);
      endItems.splice(destination.index, 0, movedItem);
      
      setColumns({
        ...columns,
        [startColumnId]: { ...startColumn, items: startItems },
        [endColumnId]: { ...endColumn, items: endItems },
      });
      
      updateTaskOnServer(draggableId, { status: endColumnId });
    }
  };

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
      <h1 className="main-title">Tablero Kanban Extendido</h1>
      <div className="kanban-board" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([columnId, column]) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps} style={{ minWidth: '300px' }}>
                  <div className="column-header">
                    <h2>{column.name || columnId}</h2>
                    {columnId === firstColumnId && (
                      <button onClick={handleOpenModal} className="add-task-btn"><Plus size={20} /></button>
                    )}
                  </div>
                  <ul className="task-list">
                    {column.items && column.items.map((item, index) => (
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

export default KanbanPage;