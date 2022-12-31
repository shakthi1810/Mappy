"use strict";

let form = document.querySelector(".form");
let inputType = document.querySelector("#inputType");
let inputDistance = document.querySelector("#distance");
let inputduration = document.querySelector("#duration");
let inputRunVal = document.querySelector("#running");
let inputSwimVal = document.querySelector("#swiming");
let inputCycleVal = document.querySelector("#cycling");
let inputRun = document.querySelector(".form-row.run");
let inputCycle = document.querySelector(".form-row.cycle");
let inputSwim = document.querySelector(".form-row.swim");
let workoutList = document.querySelector(".workout-list");
let btn = document.querySelector("#btn");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    //prettier-ignore
    let month = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      month[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class Swimming extends Workout {
  type = "swimming";

  constructor(coords, distance, duration, swimLength) {
    super(coords, distance, duration);
    this.swimLength = swimLength;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];

  constructor() {
    this._getLocation();

    this._getLocalStorage();

    form.addEventListener("keyup", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField.bind(this));
    workoutList.addEventListener("click", this._moveWorkout.bind(this));
    btn.addEventListener("click", this._resetLocalStorage.bind(this));
  }

  _getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Test the location");
        }
      );
    }
  }

  _loadMap(position) {
    let { latitude } = position.coords;
    let { longitude } = position.coords;
    let coordinates = [latitude, longitude];
    this.#map = L.map("map").setView(coordinates, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => this.renderMapMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("form_hide");
  }

  _toggleElevationField() {
    if (inputType.value == "Running") {
      inputRun.classList.remove("row_hide");
      inputCycle.classList.add("row_hide");
      inputSwim.classList.add("row_hide");
    } else if (inputType.value == "Cycling") {
      inputRun.classList.add("row_hide");
      inputCycle.classList.remove("row_hide");
      inputSwim.classList.add("row_hide");
    } else if (inputType.value == "Swiming") {
      inputRun.classList.add("row_hide");
      inputCycle.classList.add("row_hide");
      inputSwim.classList.remove("row_hide");
    }
  }

  _newWorkout(e) {
    if (e.key == "Enter") {
      e.preventDefault();

      let validateInput = (...inputs) =>
        inputs.every((inp) => Number.isFinite(inp));

      let validatePositive = (...inputs) => inputs.every((inp) => inp > 0);

      let type = inputType.value;
      let distance = +inputDistance.value;
      let duration = +inputduration.value;
      let { lat, lng } = this.#mapEvent.latlng;
      let workout;

      if (type == "Running") {
        let cadance = +inputRunVal.value;
        if (
          !validateInput(distance, duration, cadance) ||
          !validatePositive(distance, duration, cadance)
        )
          return alert("Input must be positive");

        workout = new Running([lat, lng], distance, duration, cadance);
      } else if (type == "Swiming") {
        let swimming = +inputSwimVal.value;
        if (
          !validateInput(distance, duration, swimming) ||
          !validatePositive(distance, duration, swimming)
        )
          return alert("Input must be positive");
        workout = new Swimming([lat, lng], distance, duration, swimming);
      } else if (type == "Cycling") {
        let cycling = +inputCycleVal.value;
        if (
          !validateInput(distance, duration, cycling) ||
          !validatePositive(distance, duration, cycling)
        )
          return alert("Input must be positive");
        workout = new Cycling([lat, lng], distance, duration, cycling);
      }

      this.#workouts.push(workout);

      // console.log(this.#workouts);

      this.renderMapMarker(workout);
      this.renderWorkOut(workout);

      form.reset();
      form.classList.add("form_hide");

      this._storeLocalStorage();
    }
  }
  renderMapMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `mapPopup ${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃" : "🚴🏻"} ${workout.description}`
      )
      .openPopup();
  }

  renderWorkOut(workout) {
    let html = `<li class="workout workout-${workout.type}" data-id="${
      workout.id
    }">
                  <h2>${workout.description}</h2>
                  <div class="lists">
                    <div class="workout-detail">
                      <span class="workout-icon">${
                        workout.type === "running" ? "🏃" : "🚴🏻"
                      }</span>
                      <span class="workout-value">${workout.distance}</span>
                      <span class="workout-unit">km</span>
                    </div>
                    <div class="workout-detail">
                      <span class="workout-icon">⏱️</span>
                      <span class="workout-value">${workout.duration}</span>
                      <span class="workout-unit">min</span>
                    </div>`;

    if (workout.type == "running") {
      html += `<div class="workout-detail">
                  <span class="workout-icon">⚡</span>
                  <span class="workout-value">${workout.pace.toFixed(1)}</span>
                  <span class="workout-unit">km/min</span>
                </div>
                <div class="workout-detail">
                  <span class="workout-icon">👣</span>
                  <span class="workout-value">${workout.cadence}</span>
                  <span class="workout-unit">spm</span>
                </div>
              </div>
            </li>`;
    }

    if (workout.type == "cycling") {
      html += `<div class="workout-detail">
                  <span class="workout-icon">⚡</span>
                  <span class="workout-value">${workout.speed.toFixed(1)}</span>
                  <span class="workout-unit">km/min</span>
                </div>
                <div class="workout-detail">
                  <span class="workout-icon">👣</span>
                  <span class="workout-value">${workout.elevation}</span>
                  <span class="workout-unit">spm</span>
                </div>
              </div>
            </li>`;
    }

    if (workout.type == "swimming") {
      html += `<div class="workout-detail">
                  <span class="workout-icon">⚡</span>
                  <span class="workout-value">${workout.pace.toFixed(1)}</span>
                  <span class="workout-unit">km/min</span>
                </div>
                <div class="workout-detail">
                  <span class="workout-icon">👣</span>
                  <span class="workout-value">${workout.swimLength}</span>
                  <span class="workout-unit">spm</span>
                </div>
              </div>
            </li>`;
    }

    workoutList.insertAdjacentHTML("beforeend", html);
  }

  _moveWorkout(e) {
    let workoutElement = e.target.closest(".workout");
    // console.log(workoutElement.dataset.id, this.#workouts);
    if (!workoutElement) return;

    let workoutCard = this.#workouts.find((cur) => {
      // console.log(cur.id);
      return cur.id == workoutElement.dataset.id;
    });

    this.#map.setView(workoutCard.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _storeLocalStorage() {
    localStorage.setItem("workout", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    let data = JSON.parse(localStorage.getItem("workout"));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach((work) => this.renderWorkOut(work));
  }

  _resetLocalStorage() {
    localStorage.clear();
    window.location.reload();
  }
}
let app = new App();
