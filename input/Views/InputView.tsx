import { FileInput } from "../Components/FileInput";
import { SpeechInput } from "../Components/SpeechInput";
import { TextInput } from "../Components/TextInput";
import { InputViewModel } from "../ViewModels/InputViewModel";

function renderInputView(element: HTMLElement) {
    element.appendChild(InputView(new InputViewModel(true, true, true)));
}

export function InputView(vm: InputViewModel) {
    const input = $reference<HTMLInputElement>();

    vm.valueChanged.add((text) => {
        if (!input.value) return;
        input.value!.value = text;
    });

    vm.valueInvalid.add((message) => {
        if (!input.value) return;
        ShowTooltip(message, input.value.parentElement!, 5000);
    });

    return (
        <div class="input">
            <FileInput
                fileProcessor={vm.fileProcessor}
                onFilesAdded={vm.addFiles}
                if={vm.enableFileInput}
            />

            <SpeechInput
                speech={vm.speechInput}
                onSpeechInput={vm.onSpeechInput}
                if={vm.enableSpeechInput}
            />

            <TextInput
                ref={input}
                placeholder="Enter your message..."
                onValueChanged={vm.onTextInput}
                fileProcessor={vm.enableFileInput ? vm.fileProcessor : undefined}
                onFilesAdded={vm.enableFileInput ? vm.addFiles : undefined}
                multiline={vm.enableMultilineInput}
            />

            <button class="send" onclick={vm.onSendButton}>
                {$Images.SendIcon}
            </button>
        </div>
    )
}