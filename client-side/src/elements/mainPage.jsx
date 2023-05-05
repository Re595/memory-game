import { gql, useApolloClient, useMutation } from '@apollo/client'
/* import { useApolloClient, gql, ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';  */
import React, { useEffect, useState } from 'react' 
import { Navigate, useNavigate } from 'react-router-dom';

const CREATE_ROOM = gql`
    mutation CreateRoom($named: String, $n: Int) {
        createRoom(name: $named, n: $n) {
        id
        Table {
            Cards {
                symbol
                key
                discovered
                discoveredBy {
                    name
                    score
                    id
                }
            }
        }
        Users {
            name
            score
            id
        }
        ref
        }
  }`; 
const MainPage = ()=>{
    const client = useApolloClient(); 
    const [info, setInfo ] = useState({ username : "", idRoom : "", pairs: 0, }); 
    const [createRoom, { loadingCreate, errorOnCreate, dataCreate }] = useMutation(CREATE_ROOM);  
    const navigate = useNavigate();
    /* useEffect( ( ) => {
        console.log(dataCreate) ; 
    }) */

    if(loadingCreate){
        return <> <h5> Wait a momment please </h5> </>
    }
    if(dataCreate) {
        return <> <h5>{ dataCreate }</h5></> 
    } 
    

   
    return <>
            
            <div className='d-flex align-items-center justify-content-center'>
                
                <div> 
                    <h5><a href='../'>The Memory Game</a></h5>
                    <div className='col-12 mt-5 d-flex align-items-center justify-content-center'>
                        <label className='form-label' >Username:</label> 
                        <input className='form-control' placeholder='Put your nickname here' defaultValue={info?.username} onBlur={ (item) => { setInfo({...info, username : item.target.value }) }}></input>
                    </div>
                    <div className='col-12 mt-5 btn-group d-flex align-items-center justify-content-center' name="initGame" >
                        <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#joinRoom" /* value={info?.idRoom} */>Join a Room</button>
                        <button className="btn btn-default"> Or </button>
                        <button type="button" className="btn btn-success" /*  */ data-bs-toggle="modal" data-bs-target="#numberPairs">Create a Room</button>
                    </div>
                </div>
                
                <div className="modal" id="joinRoom" tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false" role="dialog" aria-labelledby="joinToARoom" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-sm" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="joinToARoom">Join to Room</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                  <label htmlFor="" className="form-label">Introduce uuid of the room: </label>
                                  <input type="text"
                                        className="form-control" 
                                        name="" id="" 
                                        aria-describedby="There goes the UUID of the Room you want to connect" 
                                        defaultValue={info?.idRoom} 
                                        onBlur={ (item) => { setInfo({...info, idRoom: item.target.value })}} 
                                        placeholder="" />
                                </div>
                            </div>
                            <div className="modal-footer">
                               {/*  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button> */}
                                <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={ () => {
                                    navigate(`/room/${info.idRoom}`,{
                                        state: {
                                            user: {
                                                name: info.username
                                            }
                                        }
                                    })
                                }}>Connect</button>
                            </div>
                        </div>
                    </div>
                </div> 
                <div className="modal" id="numberPairs" tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false" role="dialog" aria-labelledby="numberPairs" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-scrollable modal-dialog-centered modal-sm" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="numberPairsTit">Insert the number of pairs</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                  <label htmlFor="" className="form-label">Introduce number of pairs for the table to crate: </label>
                                  <input type="number"
                                        className="form-control" 
                                        name="" id="" 
                                        aria-describedby="This field is used for declare the number of pairs used on the table of the match of memory" 
                                        defaultValue={info?.pairs} 
                                        onBlur={ (item) => { setInfo({...info, pairs: item.target.value })}} 
                                        placeholder="" />
                                </div>
                            </div>
                            <div className="modal-footer">
                               {/*  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button> */}
                                <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={ () => {
                                    createRoom({ 
                                        variables: {
                                            named : info?.username, 
                                            n: parseInt(info?.pairs)
                                        }
                                    }).then( ( data2) => {
                                        let { data } = data2; 
                                        /* console.log(data.createRoom.Users.find( item => item.name === info?.username)); 
                                        debugger;  */
                                        navigate(`/room/${data.createRoom.id}`,{
                                            state: {
                                                user: data.createRoom.Users.find( item => item.name === info?.username)
                                            }
                                        })
                                    })
                                }}>Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    </>
}
export default MainPage ; 