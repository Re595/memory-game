import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// @ts-ignore
import { ApolloClient, InMemoryCache, ApolloProvider, split, HttpLink  } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';  
import 'bootstrap-icons/bootstrap-icons.svg' 
import 'bootstrap-icons/font/bootstrap-icons.css'
import { BrowserRouter } from 'react-router-dom';

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const HOSTNAME = process.env.HOSTNAME || "https://memory-game-test.onrender.com"; 

const PORT = process.env.PORT || 4000; 

const httpLink = new HttpLink({
  uri: `https://memory-game-test.onrender.com/api/gql/`, 
})
const wsLink = new GraphQLWsLink(createClient({
  url: `wss://memory-game-test.onrender.com/api/gql`,
})); 

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
); 

const client = new ApolloClient({
  link: splitLink, 
  cache: new InMemoryCache(),

});
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <BrowserRouter>
      <ApolloProvider client={client}>
        <App/>
      </ApolloProvider>
    </BrowserRouter>
);
reportWebVitals();
