import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { getPlanById, createPlan, updatePlan } from '../../api/plan.api';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { FaPlus, FaTrash, FaSave, FaArrowLeft, FaGripVertical } from 'react-icons/fa';

const Planner = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNewPlan = planId === 'new';
  
  const { data: plan, isLoading } = useQuery(
    ['plan', planId], 
    () => getPlanById(planId!),
    { enabled: !isNewPlan }
  );

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setDestination(plan.destination);
      setStartDate(new Date(plan.startDate).toISOString().split('T')[0]);
      setEndDate(new Date(plan.endDate).toISOString().split('T')[0]);
      setSchedule(plan.schedule || []);
    }
  }, [plan]);

  const createPlanMutation = useMutation(createPlan, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('userPlans');
      navigate(`/plan/${data.id}`);
    }
  });

  const updatePlanMutation = useMutation(updatePlan, {
    onSuccess: () => {
      queryClient.invalidateQueries(['plan', planId]);
      queryClient.invalidateQueries('userPlans');
    }
  });

  const handleSave = () => {
    const planData = { title, destination, startDate, endDate, schedule };
    if (isNewPlan) {
      createPlanMutation.mutate(planData);
    } else {
      updatePlanMutation.mutate({ planId: planId!, ...planData });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newSchedule = Array.from(schedule);
    const [reorderedItem] = newSchedule.splice(result.source.index, 1);
    newSchedule.splice(result.destination.index, 0, reorderedItem);
    setSchedule(newSchedule);
  };
  
  const addScheduleItem = () => {
      setSchedule([...schedule, { id: `item-${Date.now()}`, time: '', place: '', memo: '' }]);
  }

  const removeScheduleItem = (index: number) => {
      const newSchedule = [...schedule];
      newSchedule.splice(index, 1);
      setSchedule(newSchedule);
  }

  if (isLoading && !isNewPlan) return <div>Loading planner...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
            <button onClick={() => navigate('/plan')} className="btn-secondary inline-flex items-center gap-2">
                <FaArrowLeft />
                Back to List
            </button>
            <h1 className="text-4xl font-bold">{isNewPlan ? 'Create a New Plan' : 'Edit Your Plan'}</h1>
            <button onClick={handleSave} className="btn-primary inline-flex items-center gap-2">
                <FaSave />
                Save Plan
            </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Plan Title" value={title} onChange={e => setTitle(e.target.value)} className="input text-2xl font-bold" />
                <input type="text" placeholder="Destination" value={destination} onChange={e => setDestination(e.target.value)} className="input" />
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
            </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="schedule">
                {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {schedule.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md ${snapshot.isDragging ? 'ring-2 ring-purple-500' : ''}`}>
                                        <div {...provided.dragHandleProps} className="cursor-grab">
                                            <FaGripVertical className="text-gray-400" />
                                        </div>
                                        <input type="time" value={item.time} onChange={e => { const newSchedule = [...schedule]; newSchedule[index].time = e.target.value; setSchedule(newSchedule); }} className="input w-32" />
                                        <input type="text" placeholder="Place" value={item.place} onChange={e => { const newSchedule = [...schedule]; newSchedule[index].place = e.target.value; setSchedule(newSchedule); }} className="input flex-grow" />
                                        <input type="text" placeholder="Memo" value={item.memo} onChange={e => { const newSchedule = [...schedule]; newSchedule[index].memo = e.target.value; setSchedule(newSchedule); }} className="input flex-grow" />
                                        <button onClick={() => removeScheduleItem(index)} className="btn-danger"><FaTrash /></button>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>

        <div className="mt-8 text-center">
            <button onClick={addScheduleItem} className="btn-secondary inline-flex items-center gap-2">
                <FaPlus />
                Add Schedule Item
            </button>
        </div>
    </div>
  );
};

export default Planner;
