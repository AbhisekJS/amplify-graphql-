import React,{useEffect,useReducer} from 'react'
import {v4 as uuid} from 'uuid'
import {API} from 'aws-amplify'
import 'antd/dist/antd.css'
import {List,Input,Button} from 'antd'
import {listNotes} from './graphql/queries'
import { onCreateNote } from './graphql/subscriptions'
// import create note mutation defination
import {
  createNote as CreateNote,
  updateNote as UpdateNote,
  deleteNote as DeleteNote} from './graphql/mutations'


const initialState={
  notes:[],
  loading: true,
  error: false,
  form: {name: '', description:''}
}

const styles={
  container: {padding:'20px'},
  input: {marginBottom: 10},
  item: {textAlign:'left'},
  p: {color: '#1980ff', cursor: 'pointer'}
}

function reducer(state,action){
  switch(action.type){
    case 'SET_NOTES' :
      return {
        ...state,
        notes: action.notes,
        loading: false,
      }
    case 'ERROR' :
      return {
        ...state,
        loading: false,
        error: SVGComponentTransferFunctionElement
      }
      case 'ADD_NOTE':
      return { ...state, notes: [action.note, ...state.notes]}
       
      case 'SET_INPUT' :
      return{ 
        ...state,
        form: {...state.form, [action.name]:action.value}
      }
      case 'RESET_FORM':
        return { ...state, form: initialState.form }
      default:
        return true;
  }

}

const App = () => {

  const CLIENT_ID = uuid();


  const[state,dispatch] = useReducer(reducer,initialState)

  // GET Notes 
  async function fetchNotes(){
    try{
      const notesData = await API.graphql({
        query:listNotes
      })
      dispatch({
        type:'SET_NOTES', notes: notesData.data.listNotes.items
      })
    }catch (err){
      console.log('error: ', err)
      dispatch({type: 'ERROR'})
    }
  }
  
  // Create Notes

  async function createNote() {
    const { form } = state
    if (!form.name || !form.description) {
    return alert('please enter a name and description')
    }
    const note = { ...form, id: CLIENT_ID, completed:
    true}
    console.log(note,form.name)
    dispatch({ type: 'ADD_NOTE', note })
    dispatch({ type: 'RESET_FORM' })

    try {
    await API.graphql({
    query: CreateNote,
    variables: { input: note }
    })
    console.log('successfully created note!')
    }catch (err) {
    console.log("error: ", err)
    }
   }

  //  Delete Notes

  async function deleteNote({id}){
    const index = state.notes.findIndex(n=>n.id===id)
    const notes = [
      ...state.notes.slice(0,index),
      ...state.notes.slice(index+1)
    ];
    dispatch({
      type: 'SET_NOTES',
      notes
    })
    try{
      await API.graphql({
        query: DeleteNote,
        variables:{input:{id}}
      })
    console.log('successfully removed note!')
    }catch (err){
      console.log({err})
    }
  }

  async function updateNote(note){
    const index = state.notes.findIndex(n=>n.id === note.id)
    const notes = [...state.notes]
    notes[index].completed = !note.completed
    dispatch({
      type:'SET_NOTES',
      notes
    })
    try{
      await API.graphql({
        query : UpdateNote,
        variables: {input:{
          id: note.id, 
          completed: notes[index].completed}}
      })
      console.log('Updated Successfully')
    }catch(err){
      console.log('error: ', err)
    }
  }


 
  // Controlled Change 

  function onChange(e){
    dispatch({
      type: 'SET_INPUT', 
      name: e.target.name, 
      value: e.target.value 
    })
  }

  

  useEffect(() => {
    fetchNotes()
    const subscription = API.graphql({
      query: onCreateNote
    })
    .subscribe({
      next: noteData =>{
        const note = noteData.value.data.onCreateNote
        if(CLIENT_ID === note.clientId)
        return(
          dispatch({
            type: 'ADD_NOTE',note
          })
        )
      }
    })
    return ()=> subscription.unsubscribe()
    }, [])

    function renderItem(item){
      return(
        <List.Item style={styles.item}
        actions={[
          <p style ={styles.p} onClick={()=> deleteNote(item)}>Delete</p>,
          <p style ={styles.p} onClick={()=> updateNote(item)}>{item.completed? 'Completed' : 'Mark Completed'}</p>
        ]}>
          <List.Item.Meta
          title={item.name}
          description={item.description}/>
        </List.Item>
      )
    }
     
  return (
      <div style={styles.container}>

      <Input
      onChange={onChange}
      value={state.form.name}
      placeholder="Note Name"
      name='name'
      style={styles.input}
      />
      <Input
      onChange={onChange}
      value={state.form.description}
      placeholder="Note description"
      name='description'
      style={styles.input}
      />

      
      <Button
      type="primary"
      onClick={createNote}>
      Create note</Button>


      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
        />
    </div>
  )
}

export default App

