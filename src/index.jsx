import './index.css';
import Chain, { goTo, label, sdl, sec, w } from './Chain';
import axios from 'axios';
import d from '@dominant/core';
import { nanoid } from 'nanoid';

let playerId = localStorage.getItem('playerId') || nanoid();

if (location.hash && !playerId.endsWith(location.hash)) {
  playerId = `${playerId.split('#')[0]}${location.hash}`;
}

localStorage.setItem('playerId', playerId);

let hub = axios.create({ baseURL: 'https://protohub.guiprav.cc/chain3' });

let track = (message, data = {}) => () => {
  hub.post('log', { ...data, playerId, message })
    .catch(err => console.error(err));
};

let Fyria = () => (
  <Chain class="mx-auto px-4 py-10">
    {track('start')}
    <h1 class="mb-8">City of Fyrya{sec(1)}</h1>
    {track('after heading')}

    {sdl(30)} "Welcome to Fyria,{sec(0.3)} the most popular
    dungeon city of the Kingdom of Yggdrasil!"{w}<br />
    <br />
    {track('welcome')}

    {sdl(30)} "The city sits on a common travel and commerce path
    that connects the capital,{sec(0.2)} Freunheira,{sec(0.2)} to
    the Old World outside our Queen's Great Holy Land."{w}<br />
    <br />
    {track('freunheira')}

		{sdl(30)} "It's a rich city that thrives on a dangerous but
    profitable dungeon.{sec(0.5)} Lots of adventurers come by
    the city to explore its dungeons,{sec(0.2)} including many
    novices who stay at the upper levels."{w}<br />
    <br />
    {track('rich city')}

    {sdl(30)} "Oh.{sec(0.5)} You do look severely underequipped!
    {sec(0.5)} Is that precisely what you're here for?"{w}<br />
    <br />

    {sdl(30)} "You'll have to register at the Adventurer Registration
    Office before you're allowed into the dungeon."{w}<br />
    <br />
    {track('have to register')}

    {sdl(30)} "... Don't gimme that look!{sec(0.8)} They'll be offering you
    free automatic post-death time-traveling under the Queen's magical Grace.
    {sec(0.8)} Judging by your rusty sword,{sec(0.2)} you'll be using the
    service a lot!"{w}<br />
    <br />
    {track('time-travel')}

    {sdl(30)} "Well,{sec(0.3)} feel free to explore the city first,
    {sec(0.3)} traveler!{sec(0.8)} Do make yourself home!"{w}<br />
    <br />
    {track('make yourself home')}
    {track('end')}
  </Chain>
);

document.querySelector('#root').append(<Fyria />);
