export function ShowModalDialog(title, element, onClose?: () => void | undefined) {
    let modal: HTMLElement | null = document.querySelector('.modal.open');
    let removeModal = false;
    if (!modal) {
        modal = (<div class="modal open" onclick={onModalClick} />);
        document.body.appendChild(modal!);
        removeModal = true;
    }

    const content = (
        <dialog open class="modal-content">
            <button class="close" onclick={closeModal}>&times;</button>
            <h2>{title}</h2>
            {element}
        </dialog>
    );

    modal!.appendChild(content);

    return closeModal;

    function onModalClick(e) {
        if (modal && e.target === modal) {
            const openModals = modal.querySelectorAll('.modal-content');
            if (openModals.length > 1) {
                openModals[openModals.length - 1].remove();
            } else {
                modal.remove();
            }
        }
    }

    function closeModal() {
        if (modal && removeModal) {
            modal.remove();
        } else {
            content.remove();
        }
        if (onClose) {
            onClose();
        }
    }
}