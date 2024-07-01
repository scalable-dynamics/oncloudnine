interface MenuProps {

}

export function Menu(props: MenuProps, children: any) {
    return (
        <div class="menu">
            {children}
        </div>
    )
}