import './index.css';
import Chain, { goTo, label, sdl, sec, w } from './Chain';
import d from '@dominant/core';

let Fyria = () => (
  /*
    <ygg checkpoint="0001" />
    <choice>
      <option label="To the dungeon" goTo="0002" />
      <option label="To the pub" goTo="0003" />
    </choice>
  */
  <Chain class="mx-auto px-4 py-10">
    <h1 class="mb-8">City of Fyrya{sec(1)}</h1>

    {Chain.if(() => false, (
      <div>{label('derp')}True</div>
    ), (
      <div>False</div>
    ))}

    {sdl(30)} "Welcome to Fyria,{sec(0.3)} the most popular
    dungeon city of the Kingdom of Yggdrasil!"{w}<br />
    <br />

    {goTo('derp')}

    {sdl(30)} "The city sits on a common travel and commerce path
    that connects the capital,{sec(0.2)} Freunheira,{sec(0.2)} to
    the Old World outside our Queen's Great Holy Land."{w}<br />
    <br />
  </Chain>
);

document.querySelector('#root').append(<Fyria />);
