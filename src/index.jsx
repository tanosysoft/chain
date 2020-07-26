import './index.css';
import Chain, { sdl, sec, w } from './Chain';
import d from '@dominant/core';

let Fyria = () => (
  /*
    <ygg checkpoint="0001" />
    <choice>
      <option label="To the dungeon" goTo="0002" />
      <option label="To the pub" goTo="0003" />
    </choice>
  */
  <Chain>
    <h1>City of Fyrya</h1>

    {sdl(30)} "Welcome to Fyria,{sec(0.3)} the most popular
    dungeon city of the Kingdom of Yggdrasil!"{w}<br />
    <br />

    <img src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/bbdfd9c4-f91b-4931-8d4d-9a0662d46d5e/d77gh7a-c1936059-49d2-4800-8e78-951775dda7bd.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOiIsImlzcyI6InVybjphcHA6Iiwib2JqIjpbW3sicGF0aCI6IlwvZlwvYmJkZmQ5YzQtZjkxYi00OTMxLThkNGQtOWEwNjYyZDQ2ZDVlXC9kNzdnaDdhLWMxOTM2MDU5LTQ5ZDItNDgwMC04ZTc4LTk1MTc3NWRkYTdiZC5naWYifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6ZmlsZS5kb3dubG9hZCJdfQ.NhSs3GtcayItXttFCnlw81waBsfkWp3oCsK2eQUluns" /><br />

    {sdl(30)} "The city sits on a common travel and commerce path
    that connects the capital,{sec(0.2)} Freunheira,{sec(0.2)} to
    the Old World outside our Queen's Great Holy Land."{w}<br />
    <br />
  </Chain>
);

document.querySelector('#root').append(<Fyria />);
