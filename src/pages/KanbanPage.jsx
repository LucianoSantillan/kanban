import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast'; // <--- Importa toast

const API_URL = 'http://localhost:3000';

const columnConfig = {
  'To do': { name: 'To Do' }, 'blocked': { name: 'Blocked' }, 'In progress': { name: 'In Progress' },
  'Ready for review': { name: 'Ready for Review' }, 'NO QA': { name: 'NO QA' },
  'READY FOR TESTING': { name: 'Ready for Testing' }, 'DONE': { name: 'Done' },
};
const firstColumnId = Object.keys(columnConfig)[0];

function KanbanPage() {
  const [columns, setColumns] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTask, setEditingTask] = useState(null); // Estado para el modal de edición/confirmación
  const [taskToDelete, setTaskToDelete] = useState(null); // Estado para el modal de eliminación

  // Carga inicial de tareas
  useEffect(() => {
    const fetchAllTasks = async () => {
      const loadingToast = toast.loading('Cargando tablero...');
      try {
        const newColumns = {};
        for (const status in columnConfig) {
          const response = await fetch(`${API_URL}/tasks?status=${status}&limit=100`);
          const data = await response.json();
          newColumns[status] = { name: columnConfig[status].name, items: data.tasks || [] };
        }
        setColumns(newColumns);
        toast.success('Tablero cargado', { id: loadingToast });
      } catch (error) {
        toast.error('No se pudieron cargar las tareas.', { id: loadingToast });
        console.error("Error al cargar tareas.", error);
      }
    };
    fetchAllTasks();
  }, []);

  // --- FUNCIONES DE API ---
  const apiCall = async (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: (data) => {
        // Asumimos que la respuesta exitosa puede devolver datos para la actualización optimista
        return messages.success;
      },
      error: messages.error,
    });
  };

  // --- HANDLERS CON LÓGICA DE UI Y LLAMADAS A API ---
  
  // SOLUCIÓN AL DRAG AND DROP
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const newColumnsState = JSON.parse(JSON.stringify(columns));
    const startColumn = newColumnsState[source.droppableId];
    const [movedItem] = startColumn.items.splice(source.index, 1);
    const endColumn = newColumnsState[destination.droppableId];
    endColumn.items.splice(destination.index, 0, movedItem);
    
    setColumns(newColumnsState); // Actualización optimista
    
    apiCall(fetch(`${API_URL}/tasks/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: destination.droppableId }),
    }), {
        loading: 'Moviendo tarea...',
        success: 'Tarea movida.',
        error: 'Error al mover la tarea.'
    });
  };
  
  // SOLUCIÓN A CREAR TAREA
  const handleAddTask = async (event) => {
    event.preventDefault();
    const text = newTaskText.trim();
    if (text === '') return;

    handleCloseModal();

    const promise = fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, status: firstColumnId }),
    }).then(res => res.json());

    const createdTask = await apiCall(promise, {
      loading: 'Creando tarea...',
      success: '¡Tarea creada!',
      error: 'Error al crear la tarea.'
    });

    // FLEXIBILIDAD: Acepta la tarea directa (e.g., `res.json()`) o anidada (`res.json().task`)
    const newTask = createdTask.task || createdTask;

    if (newTask && newTask.id) {
        setColumns(prev => {
            const newCols = { ...prev };
            newCols[firstColumnId].items.push(newTask);
            return newCols;
        });
    }
  };

  const handleUpdateTask = async (taskId, newText) => {
    if (!newText || newText.trim() === '') return;
    
    const originalColumns = JSON.parse(JSON.stringify(columns)); // Backup
    // Optimistic Update
    setColumns(prev => {
        const newCols = JSON.parse(JSON.stringify(prev));
        for (const colId in newCols) {
            const task = newCols[colId].items.find(t => t.id === taskId);
            if (task) {
                task.text = newText;
                break;
            }
        }
        return newCols;
    });

    try {
      await apiCall(fetch(`${API_URL}/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newText }),
      }), {
          loading: 'Actualizando tarea...',
          success: 'Tarea actualizada.',
          error: 'Error al actualizar.'
      });
    } catch (error) {
      setColumns(originalColumns); // Revert on error
    }
    setEditingTask(null); // Cierra el modal de edición
  };

  const handleDeleteTask = async (taskId, columnId) => {
    setTaskToDelete(null); // Cierra el modal de confirmación
    const originalColumns = JSON.parse(JSON.stringify(columns)); // Backup

    // Optimistic Update
    setColumns(prev => {
        const newCols = { ...prev };
        newCols[columnId].items = newCols[columnId].items.filter(item => item.id !== taskId);
        return newCols;
    });
    
    try {
      await apiCall(fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' }), {
        loading: 'Eliminando tarea...',
        success: 'Tarea eliminada.',
        error: 'Error al eliminar.',
      });
    } catch (error) {
      setColumns(originalColumns); // Revert on error
    }
  };
  
  // --- Funciones para abrir y cerrar modales ---
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTaskText('');
  };

  // JSX del componente
  return (
    <div className="app-container">
      <h1 className="main-title">Tablero Kanban Extendido</h1>
      <div className="kanban-board">
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([columnId, column]) => (
            <Droppable droppableId={columnId} key={columnId}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
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
                            onDoubleClick={() => setEditingTask(item)}
                          >
                            <span>{item.text}</span>
                            <button onClick={() => setTaskToDelete(item)} className="delete-task-btn">
                              <Trash2 size={16} />
                            </button>
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

      {/* --- Modales --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddTask}>
              <h3>Crear Nueva Tarea</h3>
              <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Descripción..." autoFocus />
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask(editingTask.id, e.target.elements.taskText.value); }}>
                    <h3>Editar Tarea</h3>
                    <input name="taskText" type="text" defaultValue={editingTask.text} autoFocus />
                    <div className="modal-actions">
                        <button type="button" onClick={() => setEditingTask(null)}>Cancelar</button>
                        <button type="submit">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {taskToDelete && (
          <div className="modal-overlay" onClick={() => setTaskToDelete(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Confirmar Eliminación</h3>
                  <p>¿Estás seguro de que quieres eliminar la tarea: "<strong>{taskToDelete.text}</strong>"?</p>
                  <div className="modal-actions">
                      <button type="button" onClick={() => setTaskToDelete(null)}>Cancelar</button>
                      <button type="button" className="danger" onClick={() => handleDeleteTask(taskToDelete.id, taskToDelete.status)}>Eliminar</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

export default KanbanPage;