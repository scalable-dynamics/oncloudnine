import { HomeViewModel } from "../ViewModels/HomeViewModel";

function renderModule1(element: HTMLElement){
    element.appendChild(HomeView(new HomeViewModel()));
}

function HomeView(vm:HomeViewModel){
    return (
        <div>
            <h1>{vm.title}</h1>
            <p>{vm.content}</p>
        </div>
    )
}