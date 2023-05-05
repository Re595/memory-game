import { ApolloServer } from '@apollo/server';
import express from "express"
import { expressMiddleware } from '@apollo/server/express4';
// @ts-ignore
import { startStandaloneServer } from '@apollo/server/standalone';
import { createServer } from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { PubSub, withFilter } from 'graphql-subscriptions';
import { useServer } from 'graphql-ws/lib/use/ws';
import { v4 as uuidGenerate } from 'uuid';
import { getEmoji } from './emojis.js';
import bodyParser from 'body-parser';
// @ts-ignore
import cors from 'cors';
import path from 'path'; 
import { fileURLToPath } from 'url';

// @ts-ignore
process.listOfRooms = []; 

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename)

const pubsub = new PubSub();

const HOSTNAME = process.env.HOSTNAME || "http://localhost"; 

const PORT = process.env.PORT || 4000; 

// @ts-ignore
const getCard = async (root, args, context, info) => {     
    let symbol = getEmoji(); 
    return {
        symbol ,
        key: uuidGenerate(/* symbol, localNamespace */), 
        discovered: false, 
        discoveredBy: null, 
    }
}
const updateCard = async (root, args, context, info) => {
    let room = await getRoom(root, { id : args.idRoom }, context, info); 
    // @ts-ignore
    let roomIndex = process.listOfRooms.findIndex( item => item.id === args.idRoom);  
    // @ts-ignore
    let userIndex = room.Users.findIndex( item => item.id === args.cardStatus.discoveredBy.id ); 
    if(userIndex !== -1 && args.cardStatus.discovered){
        // @ts-ignore
        room.Users[userIndex].score += 1 ; 
    }

    // @ts-ignore
    let cardIndex = room.Table.Cards.findIndex( item => item.key === args.keyCard);  
    
    if(cardIndex === -1){
        throw new Error("Card not finded!"); 
    }
    // @ts-ignore
    room.Table.Cards[cardIndex] = { ...room.Table.Cards[cardIndex], ...args.cardStatus } 
    // @ts-ignore
    process.listOfRooms[roomIndex] = room; 
    console.log("sended room due card change: ", room); 
    pubsub.publish('ROOM_UPDATED', { roomUpdated: { ...room } }); 
    return room; 
}
// @ts-ignore
const getRoom = async (root, args, context, info) => {     
    // @ts-ignore
    return process.listOfRooms.find( item => item.id == args.id);  
} 
const joinRoom = async (root, args, context, info) => {     
    // @ts-ignore
    let roomIndex = process.listOfRooms.findIndex( item => item.id == args.idRoom);   
    // @ts-ignore
    process.listOfRooms[roomIndex].Users.forEach( item => {
        if(item.name == args.username){
            throw new Error(`The username ${args.username } is taken, please choose a new one!`)
        }
    })
    // @ts-ignore
    process?.listOfRooms[roomIndex].Users.push(await createUser(root, {name : args.username}, context, info )); 
    // @ts-ignore
    pubsub.publish('ROOM_UPDATED', { roomUpdated: { ...process.listOfRooms[roomIndex] } }); 
    // @ts-ignore
    return process.listOfRooms[roomIndex]; 

} 
// @ts-ignore
const createTable = async (root, args, context, info) => {
    let { n } = args; 
    
    if( n <= 0 ){
        throw new Error("Number of pairs must be greater than 0");  
    }

    
    let response = []; 
    for(let i = 0; i < (n); i++){
        let newCard = await getCard(); 
        response.push(newCard); 
    }
    return { Cards: response };    
}; 

// @ts-ignore
const createUser = async (root, args, context, info) => {
    return {
        name: args.name,
        score: 0, 
        id: uuidGenerate(), 
    }
}
const createRoom = async (root, args, context, info) => {
    let idRoom = uuidGenerate(); 
    let response = {
        id: idRoom, 
        Table: await createTable(root, args, context, info), 
        Users: [await createUser(root, args, context, info)], 
        ref: `${HOSTNAME}/room/${idRoom}`, 
    }
    // @ts-ignore
    process.listOfRooms.push(response); 
    return response 
} 

// @ts-ignore
const indexRoom = async (root, args, context, info) => {
    // @ts-ignore
    return process.listOfRooms; 
} 
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Card{
    symbol: String, 
    key: ID, 
    discovered: Boolean, 
    discoveredBy: User,  
  }
    input CardInput{
    symbol: String, 
    key: ID, 
    discovered: Boolean, 
    discoveredBy: UserInput,
  }
  input CardStatusInput{
    discovered: Boolean, 
    discoveredBy: UserInput,  
  }
  type  Table{
    Cards: [Card], 
  }
  type User{
    name: String, 
    score: Int,  
    id: ID 
  }

  input UserInput{
    name: String, 
    id: ID, 
  }
  type Room{
    id: ID, 
    Table: Table, 
    Users: [User], 
    ref: String, 
  }

  type Query {
    getCard: Card, 
    getRoom(id: ID!): Room
    indexRoom: [Room] 
  }

  type Mutation{
    createTable(n: Int): Table, 
    createRoom(name: String, n: Int): Room, 
    createUser(name: String): User,
    updateCard(idRoom: ID, keyCard: ID, cardStatus: CardStatusInput): Room
    joinRoom(username: String, idRoom: ID): Room
  }

  type Subscription{
    roomUpdated(idRoom: String): Room
  }
  
`;
/* const localNamespace = '5662307e-8d5e-4e2b-b752-13306110ddef';  */
const resolvers = {
    Query: {
        getCard,
        getRoom, 
        indexRoom, 
    },
    Mutation: {
        createTable,  
        createUser, 
        createRoom, 
        updateCard, 
        joinRoom
    }, 
    Subscription:{
        roomUpdated: {
            subscribe : /* (() => pubsub.asyncIterator('ROOM_UPDATED')) */ withFilter(() => pubsub.asyncIterator('ROOM_UPDATED'), (payload, variables) => {
                console.log("payload: ", payload); 
                return (payload.roomUpdated.id === variables.idRoom)
            }) 
        } 
    }
};



/* const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});
   */
const app = express(); 
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));  
const httpServer = createServer(app); 
const schema = makeExecutableSchema({ typeDefs, resolvers });
const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api/gql',
});
const serverCleanup = useServer({ schema }, wsServer); 
const server = new ApolloServer({
    schema, 
    /* csrfPrevention: true, */
    /* cache: 'bounded', */
    plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {   // Proper shutdown for the WebSocket server.
            async serverWillStart() {
                return {
                    async drainServer() {
                        await serverCleanup.dispose();
                    },
                };
            },
        },
    ]
})
await server.start(); 

app.use('/api/gql/' ,/* cors<cors.CorsRequest>(), */ bodyParser.json(), expressMiddleware(server)); 
/* app.use(express.static("client")); 
// @ts-ignore
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html")); 
}) */

app.use(express.static(path.join(__dirname, ".", "client-side/build")));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, ".", "client-side/build", "index.html"));
  });
/* app.use(express.static("client-side/public")); */


// Now that our HTTP server is fully set up, we can listen to it.

httpServer.listen(PORT, () => {

  console.log(`Server is now running on ${HOSTNAME}:${PORT}/api/gql/`);

});
