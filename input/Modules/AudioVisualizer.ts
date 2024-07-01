import { AudioAnalyzer } from "./AudioAnalyzer";

export class AudioVisualizer {
    private canvasContext: CanvasRenderingContext2D;

    constructor(
        private audioAnalyzer: AudioAnalyzer,
        canvas: HTMLCanvasElement,
        private width: number,
        private height: number
    ) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.borderRadius = '50%';
        this.canvasContext = canvas.getContext('2d')!;
    }

    visualize() {
        const dataArray = this.audioAnalyzer.dataArray;
        this.canvasContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.canvasContext.fillRect(0, 0, this.width, this.height);
        const barWidth = (this.width / dataArray.length) * 2.5;
        let barHeight, maxBarHeight = 0, reachedThreshold = false;
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
            barHeight = dataArray[i];
            this.canvasContext.fillStyle = barHeight > this.audioAnalyzer.threshold ? 'rgb(0, 255, 0)' : 'rgb(' + (barHeight + 100) + ',50,50)';
            this.canvasContext.fillRect(x - (barWidth * 120), this.height / 2 - barHeight, barWidth, barHeight * 2);
            x += barWidth + 1;
            if (barHeight > maxBarHeight) maxBarHeight = barHeight;
            reachedThreshold = reachedThreshold || (barHeight > this.audioAnalyzer.threshold);
        }

        this.canvasContext.strokeStyle = reachedThreshold ? 'rgb(0, 255, 0)' : 'rgb(' + (maxBarHeight + 100) + ',50,50)';
        this.canvasContext.lineWidth = .5;
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(0, this.height / 2);
        this.canvasContext.lineTo(this.width, this.height / 2);
        this.canvasContext.stroke();

        // Draw threshold line
        // this.canvasContext.strokeStyle = 'rgb(0, 255, 0)';
        // this.canvasContext.lineWidth = 2;
        // this.canvasContext.beginPath();
        // this.canvasContext.moveTo(0, this.height / 2 - this.audioAnalyzer.threshold / 2);
        // this.canvasContext.lineTo(this.width, this.height / 2 - this.audioAnalyzer.threshold / 2);
        // this.canvasContext.stroke();
    }
}