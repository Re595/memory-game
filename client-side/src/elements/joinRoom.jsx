import { gql, useApolloClient, useLazyQuery, useMutation, useSubscription } from '@apollo/client'
import { useLocation, useNavigate, useParams } from "react-router-dom";
/* import { useApolloClient, gql, ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';  */
import React, { useEffect, useState } from 'react' 
import ReactDOM from 'react-dom/client';
import arrayShuffle from 'array-shuffle'
import { render } from '@testing-library/react';

const JOIN_ROOM = gql`
    mutation JoinRoom($username: String, $idRoom: ID) {
        joinRoom(username: $username, idRoom: $idRoom) {
            id
            ref
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
            
        }
    }
`;
const GET_ROOM = gql`
    query GetRoom($getRoomId: ID!) {
        getRoom(id: $getRoomId) {
            id
            ref
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
            
        }
    }
`; 
const UPDATE_ROOM_SUBSCRIPTION = gql`
subscription RoomUpdated($idRoom: String) {
  roomUpdated(idRoom: $idRoom) {
        id
        ref
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
        
    }
}
`; 
const UPDATE_CARD = gql`
mutation UpdateCard($idRoom: ID, $keyCard: ID, $cardStatus: CardStatusInput) {
    updateCard(idRoom: $idRoom, keyCard: $keyCard, cardStatus: $cardStatus) {
      Table {
        Cards {
          discovered
          discoveredBy {
            score
            name
            id
          }
          key
          symbol
        }
      }
      Users {
        id
        name
        score
      }
      id
      ref
    }
}`
/* const getRoomInfo = async (client, id) => {
    return await client.query({
        query: JOIN_ROOM
    })
} */

const JoinRoom = ()=>{
    const client = useApolloClient(); 
    const { id } = useParams(); 
    const { state : localState } = useLocation();  
    const navigate = useNavigate();
   
    const [joinRoom, { loading : loadingInfo, error: errorInfo, data: dataInfo }] = useMutation(JOIN_ROOM);  
    const [getRoom, { subscribeToMore : onUpdateRoom }] = useLazyQuery(GET_ROOM); 

    //console.log("the id of the room is: ", id);  
    const [roomData, setRoomData ] = useState({ }); 

    const [ initedDeck, setInitedDeck ] = useState(false); 
    
    const [triggerEffect, setTriggerEffect ] = useState(false); 

    // const { data : dataSub , loading: loadingCardUpd} = useSubscription(UPDATE_ROOM_SUBSCRIPTION, { 
    //     variables : { idRoom : id }, 
    //     /* onComplete : ()=>{
    //         if(!loadingCardUpd){
    //             console.log(dataSub); 
    //         }
    //     }   */
    // }) 

    useEffect( () => {
        console.log("is in"); 
        setTriggerEffect(false); 
        if(localState.user?.id === undefined && localState?.user?.name != null){
            joinRoom({
                variables: {
                    idRoom: id, 
                    username : localState.user.name
                }
            }).then( response => {
                //console.log("the response of the useEffect is: ", response);
                navigate(`/room/${id}`,{
                    state: {
                        user: response.data?.joinRoom.Users.find( item => item.name === localState?.user?.name)
                    }
                }); 
            }) 
        }else if (localState?.user == null){
            throw new Error("Localstate in not correct setted state please go to the index"); 
        }else{
            getRoom({
                variables: {
                    getRoomId: id 
                }
            }).then( response => {
                console.log("the response of the useEffect is: ", response);
                setRoomData(response.data?.getRoom); 
            }); 
        } 
        if(roomData?.Table?.Cards !== undefined){
            if(initedDeck === false){
                setInitedDeck(arrayShuffle(Array.from(roomData.Table.Cards).map( item => {
                    let auxArr = []; 
                    auxArr.push(item); 
                    auxArr.push(item); 
                    return auxArr; 
                }).flat(2))); 
            }else{
                
                setInitedDeck( initedDeck.map(  item => {
                    return roomData?.Table?.Cards.find( (subitem) => subitem.key === item.key); 
                }))
            }
        }

        
    }, [joinRoom, getRoom, localState, dataInfo, id, roomData, navigate]);  
    return <>
            <div className='container d-flex align-items-center'>
                <div className='col-xs-12 col-4 align-baseline'>
                    <h5><a href='../'>The Memory Game</a></h5>
                    <div className='d-flex align-items-center justify-content-center'>
                        <h5>Welcome {localState.user.name}</h5>
                    </div> 
                    <div>
                        <h5>{roomData?.id !== undefined ? `The id of the room is: ${roomData.id}` : ""}</h5>    
                    </div> 
                    <div>
                        {/* <h5>List of connected users</h5>
                        <ul>
                            { (roomData?.Users === undefined ) ? '' : roomData?.Users.map( item => { 
                                return <ul key={item.id}>{item.name}</ul>
                            })}
                        </ul> */}
                        <h5>Table Score</h5>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Name</th>
                                        <th scope="col">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    { (roomData?.Users === undefined ) ? '' : roomData?.Users.map( item => { 
                                        return <tr>
                                            <td>{item.name}</td>
                                            <td>{item.score}</td>
                                        </tr>
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                    </div>
                </div>
                <div className='col-xs-12 col-8'>
                    <h4 className='mb-5'>Choose two cards</h4>
                    <div className="container mt-5 col-8">
                        { initedDeck !== undefined && initedDeck !== false ?  <CreateTable deckStateObj={{ initedDeck, setInitedDeck }}tableData={ initedDeck } onUpdateRoom={onUpdateRoom({
                            document: UPDATE_ROOM_SUBSCRIPTION, 
                            variables: {
                                idRoom: id
                            }, 
                            updateQuery: (prev, { subscriptionData  })=>{
                                if (!subscriptionData.data){
                                    return false; 
                                }else{ 
                                    console.log("sub res", subscriptionData); 
                                    setRoomData(subscriptionData?.data?.roomUpdated); 
                                }
                                
                                return {...subscriptionData, ...prev}; 

                            }, 
                        })}></CreateTable> : <a href='../'>Not cards entered yet (maybe the room isn't available) </a>}
                    </div>
                </div>
            </div>
    </>
}
export default JoinRoom; 

const CreateTable = ({ tableData, deckStateObj })=>{
    
    const [updateCard, { loadingCard, errorOnCard, dataCard }] = useMutation(UPDATE_CARD);  
    const { id } = useParams(); 
    const { state : localState } = useLocation();  
    let deck = tableData; 
    console.log(deck); 
    //deckSetState(deck.map( item => { return {...item, symbol: null} ; })); 
    /* useEffect( () => onUpdateRoom(),[]);  */
    let previousIndex = false; 
    return (<div>
        {
            deck.map( (item, index) => {
                return ( item.discovered ) ? 
                    <button name="card" className="border border-dark rounded p-3 m-2" key={index}>{item.symbol}</button> : 
                    <button name="card" className="border border-dark rounded p-3 m-2" key={index}
                    onClick={ (element) => {  
                        let el = element.target; 
                        /* if(el.nodeName === "I" || el.nodeName === "SPAN"){
                            el = element.target.parentNode;  
                        } */
                        el.classList.add('selected');  
                        el.innerHTML = deck[index]?.symbol; 
                        let selectedItems = document.getElementsByClassName("selected");
                        if(selectedItems.length === 2){
                            console.log('deck', deck); 
                            if(deck[index].key === deck[previousIndex].key){
                                updateCard({
                                    variables: {
                                        idRoom: id, 
                                        keyCard: deck[index].key, 
                                        cardStatus: {
                                            discovered: true, 
                                            discoveredBy: {
                                                id: localState.user.id, 
                                                name: localState.user.name
                                            }
                                        }
                                    }
                                })
                                Array.from(selectedItems).forEach( item => {
                                    if(item.classList.contains("selected")) item.classList.remove("selected");  
                                }) 
                                previousIndex = false; 
                                return true; 
                            }else{
                                Array.from(selectedItems).forEach( item => {
                                    if(item.classList.contains("selected")) item.classList.remove("selected");  
                                    item.innerHTML = "???"; 
                                }) 
                                previousIndex = false; 
                                return true; 
                            }
                        }
                        previousIndex = index; 
                        return true; 
                    } 
                } 
                    >???
                    </button>
            })
        }
    </div>) 
    

} 