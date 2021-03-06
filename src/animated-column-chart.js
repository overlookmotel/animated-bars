/* Animated column chart --------------------------------------------------- */

/* Imports ----------------------------------------------------------------- */

import { AnimatedRectangleChart } from "./animated-rectangle-chart.js";
import { getConstants } from "./constants.js";
import { d3 } from "./d3-sub.js";

/* Constants --------------------------------------------------------------- */

const constants = getConstants();

/* Class ------------------------------------------------------------------- */

class AnimatedColumnChart extends AnimatedRectangleChart {

    constructor(data, config = {}) {

        super(data, config);

        // Create chart scales
        this.keyScale = d3.scaleBand()
            .domain(this.setupData.map(d => d.key))
            .range([0, this.width])
            .paddingInner(this.valuePaddingInner)
            .paddingOuter(this.valuePaddingOuter);

        this.valueScale = d3.scaleLinear()
            .domain([this.valueMin, this.valueMax])
            .range([this.height, 0]);

        // Limit values to those representable within the valueScale domain
        this.valueScaleSafe = (value) => {
            if (value < this.valueMin) {
                console.warn("Value below y-axis domain: set to minimum");
                return this.valueScale(this.valueMin);
            }
            if (value > this.valueMax) {
                console.warn("Value above y-axis domain: set to maximum");
                return this.valueScale(this.valueMax);
            }
            return this.valueScale(value);
        };

        // Convert positions on the valueAxis to values
        this.valueScaleInverse = d3.scaleLinear()
            .domain([this.height, 0])
            .range([this.valueMin, this.valueMax]);
    }

    /* Public API ---------------------------------------------------------- */

    // Create the chart inside its html element with initial data
    create() {

        // Get update data using initial data
        const updateData = this.getUpdateData(this.setupData);

        // Create svg
        this.selections.svg = d3.select(`#${this.element}`)
            .append("svg")
            .attr("width",
                this.width +
                this.margins.left +
                this.margins.right)
            .attr("height",
                this.height +
                this.margins.top +
                this.margins.bottom);

        // Add background
        if (this.background !== "") {
            this.selections.svg
                .append("rect")
                .attr("fill", this.background)
                .attr("width",
                    this.width +
                    this.margins.left +
                    this.margins.right)
                .attr("height",
                    this.height +
                    this.margins.top +
                    this.margins.bottom);
        }

        // Add title
        if (this.title !== "") {
            this.selections.svg.append("text")
                .attr("class", constants.classTitle)
                .text(this.title)
                .attr("x", this.titleOffsetX)
                .attr("y", this.titleOffsetY)
                .style("font-size", `${this.titleSize}pt`)
                .style("fill", this.titleColor);
        }

        // Add subtitle
        if (this.subtitle !== "") {
            this.selections.svg.append("text")
                .attr("class", constants.classSubtitle)
                .text(this.subtitle)
                .attr("x", this.subtitleOffsetX)
                .attr("y", this.titleOffsetY + this.subtitleOffsetY) 
                .style("font-size", `${this.subtitleSize}pt`)
                .style("fill", this.subtitleColor);
        }

        // Create data group
        this.selections.dataGroup = this.selections.svg
            .append("g")
            .attr("transform", `translate(
                ${this.margins.left},
                ${this.margins.top})`);

        // Create bars
        this.selections.dataGroup.selectAll(`.${constants.classValue}`)
            .data(updateData)
            .enter()
            .append("rect")
            .attr("shape-rendering", this.shapeRendering)
            .attr("class", d => {
                const cn = d.nextValue < 0 ?
                    constants.classNeg :
                    constants.classPos;
                return `${constants.classValue} ${cn}`;
            });

        this.selections.dataGroup.selectAll(`.${constants.classPos}`)
            .attr("x", d => this.keyScale(d.key))
            .attr("y", d => this.valueScaleSafe(d.nextValue))
            .attr("width", this.keyScale.bandwidth())
            .attr("height", d => {
                return this.valueScale(0) - this.valueScaleSafe(d.nextValue);
            })
            .attr("fill", d => d.posRgb);

        this.selections.dataGroup.selectAll(`.${constants.classNeg}`)
            .attr("x", d => this.keyScale(d.key))
            .attr("y", this.valueScale(0))
            .attr("width", this.keyScale.bandwidth())
            .attr("height", d => {
                return this.valueScaleSafe(d.nextValue) - this.valueScale(0);
            })
            .attr("fill", d => d.negRgb);

        // Create key axis
        const keyAxis =
            this.keyLocation == constants.keyLocationMax ?
                d3.axisTop() :
                d3.axisBottom();

        keyAxis.scale(this.keyScale)
            .tickSizeInner(this.keyTickSizeInner)
            .tickSizeOuter(this.keyTickSizeOuter)
            .tickPadding(this.keyTickPadding);

        // Add key axis
        this.selections.keyAxisGroup = this.selections.dataGroup.append("g")
            .attr("class", constants.classKeyAxis)
            .attr("transform", `translate(0,
                ${this.getKeyLocationTransform()})`)
            .call(keyAxis);

        // Set fonts and colors for text on the key axis
        this.selections.keyAxisGroup
            .selectAll("text")
            .style("font-size", `${this.keyTextSize}pt`)
            .style("fill", this.keyTextColor)

        // Set colors for paths and lines on the key axis
        this.selections.keyAxisGroup
            .selectAll("path")
            .style("color", this.keyLineColor)

        this.selections.keyAxisGroup
            .selectAll("line")
            .style("color", this.keyLineColor)

        // Add key axis title
        if (this.keyTitle !== "") {
            this.selections.dataGroup.append("text")
                .attr("transform", `translate(
                    ${this.width / 2},
                    ${this.getKeyTitleTransform()})`)
                .attr("class", constants.classKeyTitle)
                .style("text-anchor", "middle")
                .style("font-size", `${this.keyTitleSize}pt`)
                .style("fill", this.keyTitleColor)
                .text(this.keyTitle);
        }

        // Create value axis
        const valueAxis =
            this.valueLocation == constants.valueLocationEnd ?
                d3.axisRight() :
                d3.axisLeft();

        valueAxis.scale(this.valueScale)
            .ticks(this.valueTicks)
            .tickSizeInner(this.valueTickSizeInner)
            .tickSizeOuter(this.valueTickSizeOuter)
            .tickPadding(this.valueTickPadding)
            .tickFormat(d3.format(this.valueFormat));

        // Add value axis
        this.selections.valueAxisGroup = this.selections.dataGroup.append("g")
            .attr("class", constants.classValueAxis)
            .attr("transform", `translate(
                ${this.getValueLocationTransform()}, 0)`)
            .call(valueAxis);

        // Set fonts and colors for text on the value axis
        this.selections.valueAxisGroup
            .selectAll("text")
            .style("font-size", `${this.valueTextSize}pt`)
            .style("fill", this.valueTextColor)

        // Set colors for paths and lines on the value axis
        this.selections.valueAxisGroup
            .selectAll("path")
            .style("color", this.valueLineColor)

        this.selections.valueAxisGroup
            .selectAll("line")
            .style("color", this.valueLineColor)

        // Add value axis title
        if (this.valueTitle !== "") {
            this.selections.dataGroup.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", this.getValueTitleTransform())
                .attr("x", 0 - (this.height / 2))
                .attr("class", constants.classValueTitle)
                .style("text-anchor", "middle")
                .style("font-size", `${this.valueTitleSize}pt`)
                .style("fill", this.valueTitleColor)
                .text(this.valueTitle);
        }

        this.created = true;
    }

    // Update the chart with new data
    update(nextData, transitionTime = this.transitionTime) {

        // If chart not created do nothing and warn
        if (! this.created) {
            console.warn("Chart has not been created");
            return;
        }

        // Return the value of the bar at its current position
        const getLastValue = (element) => {

            const box = element.node().getBBox();
            const valueZero = this.valueScale(0);
            const yDistance = Math.abs(box.y - valueZero);
            const yHeightDistance = Math.abs(box.y + box.height - valueZero);

            if (yDistance > yHeightDistance) {
                return this.valueScaleInverse(box.y);
            } else {
                return this.valueScaleInverse(valueZero + box.height);
            }
        };

        const updateData = this.getUpdateData(nextData);

        this.selections.dataGroup.selectAll(`.${constants.classValue}`)
            .data(updateData)
            .attr("class", function(d) {

                const element = d3.select(this);
                d.lastValue = getLastValue(element);

                let attr = constants.classValue;
                if (d.lastValue >= 0 && d.nextValue >= 0) {
                    attr = `
                        ${constants.classValue}
                        ${constants.classPosToPos}`;
                }
                if (d.lastValue < 0 && d.nextValue < 0) {
                    attr = `
                        ${constants.classValue}
                        ${constants.classNegToNeg}`;
                }
                if (d.lastValue >= 0 && d.nextValue < 0) {
                    attr = `
                        ${constants.classValue}
                        ${constants.classPosToNeg}`;
                }
                if (d.lastValue < 0 && d.nextValue >= 0) {
                    attr = `
                        ${constants.classValue}
                        ${constants.classNegToPos}`;
                }
                return attr;
            });

        this.selections.dataGroup.selectAll(`.${constants.classPosToPos}`)
            .transition()
            .delay(d => d.delay)
            .duration(transitionTime)
            .ease(d3.easeCubic)
            .attr("y", d => this.valueScaleSafe(d.nextValue))
            .attr("height", d => {
                return this.valueScale(0) - this.valueScaleSafe(d.nextValue);
            })
            .attr("fill", d => d.posRgb);

        this.selections.dataGroup.selectAll(`.${constants.classNegToNeg}`)
            .transition()
            .delay(d => d.delay)
            .duration(transitionTime)
            .ease(d3.easeCubic)
            .attr("y", this.valueScale(0))
            .attr("height", d => {
                return this.valueScaleSafe(d.nextValue) - this.valueScale(0);
            })
            .attr("fill", d => d.negRgb);

        this.selections.dataGroup.selectAll(`.${constants.classPosToNeg}`)
            .transition()
            .delay(d => d.delay)
            .duration(d => {
                const pc = (d.lastValue /  (d.lastValue - d.nextValue));
                return transitionTime * pc;
            })
            .ease(d3.easeCubicIn)
            .attr("y", this.valueScale(0))
            .attr("height", 0)
            .attr("fill", d => d.posRgb)
            .transition()
            .duration(d => {
                const pc = (-1 * d.nextValue /  (d.lastValue - d.nextValue));
                return transitionTime * pc;
            })
            .ease(d3.easeCubicOut)
            .attr("y", this.valueScale(0))
            .attr("height", d => {
                return this.valueScaleSafe(d.nextValue) - this.valueScale(0);
            })
            .attr("fill", d => d.negRgb);

        this.selections.dataGroup.selectAll(`.${constants.classNegToPos}`)
            .transition()
            .delay(d => d.delay)
            .duration(d => {
                const pc = (-1 * d.lastValue /  (d.nextValue - d.lastValue));
                return transitionTime * pc;
            })
            .ease(d3.easeCubicIn)
            .attr("y", this.valueScale(0))
            .attr("height", 0)
            .attr("fill", d => d.negRgb)
            .transition()
            .duration(d => {
                const pc = (d.nextValue /  (d.nextValue - d.lastValue));
                return transitionTime * pc;
            })
            .ease(d3.easeCubicOut)
            .attr("y", d => this.valueScaleSafe(d.nextValue))
            .attr("height", d => {
                return this.valueScale(0) - this.valueScaleSafe(d.nextValue);
            })
            .attr("fill", d => d.posRgb);
    }

    /* Internal methods ---------------------------------------------------- */

    getDefaults() {
        const defaults = super.getDefaults();
        defaults.valueLocation = "start";
        return defaults;
    }

    getKeyLocationTransform() {
        switch (this.keyLocation) {
        case constants.keyLocationMin:
            return this.height;
        case constants.keyLocationZero:
            return this.valueScale(0);
        case constants.keyLocationMax:
            return 0;
        default:
            return this.height;
        }
    }

    getKeyTitleTransform() {
        switch (this.keyLocation) {
        case constants.keyLocationMin:
            return this.height + this.keyTitleOffset;
        case constants.keyLocationZero:
            return this.height + this.keyTitleOffset;
        case constants.keyLocationMax:
            return 0 - this.keyTitleOffset;
        default:
            return this.height + this.keyTitleOffset;
        }
    }

    getValueLocationTransform() {
        switch (this.valueLocation) {
        case constants.valueLocationStart:
            return 0;
        case constants.valueLocationEnd:
            return this.width;
        default:
            return 0;
        }
    }

    getValueTitleTransform() {
        switch (this.valueLocation) {
        case constants.valueLocationStart:
            return 0 - this.valueTitleOffset;
        case constants.valueLocationEnd:
            return this.width + this.valueTitleOffset;
        default:
            return 0 - this.valueTitleOffset;
        }
    }
}

/* Exports ----------------------------------------------------------------- */

export {
    AnimatedColumnChart
};
