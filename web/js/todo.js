/*
 This is a simple implementation of the to do box.

 ES6 is required.
 */

/**
 * Stores all the current to do items.
 * @type {Array}
 */
var data = [];

var Todo = React.createClass({
    render: function () {
        //Build our
        var completedButton;
        if (this.props.completed == true) {
            //Ticked completed button that sets to uncompleted
            completedButton = (
                <label class="btn btn-success active">
                    <input type="checkbox" checked autocomplete="off"/> DONE
                </label>
            );
        } else {
            //Unticked completed button that sets to completed
            completedButton = (
                <label class="btn btn-primary active">
                    <input type="checkbox" autocomplete="off"/> TODO
                </label>
            );
        }
        return (
            <a href="#" className="todo list-group-item">
                <span>
                    {completedButton}
                </span>
                <span className="todoTitle">
                    {this.props.title}
                </span>
                <span className="tag tag-default tag-pill pull-xs-right deleteTodoButton">X</span>
            </a>
        );
    }
});

var TodoList = React.createClass({
    render: function () {
        //Render dynamically
        var todoNodes = this.props.data.map(function (todo) {
            return (
                <Todo title={todo.title} _id={todo._id} completed={todo.completed}/>
            );
        });
        return (
            <div className="todoList">
                {todoNodes}
            </div>
        );
    }
});

var TodoForm = React.createClass({
    getInitialState: function () {
        return {title: ''};
    },
    handleTitleChange: function (e) {
        this.setState({title: e.target.value});
    },
    handleSubmit: function (e) {
        e.preventDefault();
        var title = this.state.title.trim();
        if (!title) {
            return;
        }
        //Send request / refresh the box (Callback defined in the parent)
        this.props.onTaskSubmit({title: title});
        this.setState({title: ''});
    },
    render: function () {
        return (
            <form className="todoForm" onSubmit={this.handleSubmit}>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Task"
                        value={this.state.title}
                        onChange={this.handleTitleChange}
                        className="form-control"
                    />
                    <input type="submit" value="Add"/>
                </div>
            </form>
        );
    }
});


var TodoBox = React.createClass({
    loadTodosFromServer: function () {
        /*
         $.ajax({
         url: this.props.url,
         dataType: 'json',
         cache: false,
         success: function(data) {
         this.setState({data: data});
         }.bind(this),
         error: function(xhr, status, err) {
         console.error(this.props.url, status, err.toString());
         }.bind(this)
         });
         */
        this.setState({data: data});
    },
    handleTodoSubmit: function (todo) {
        var optimisticData = [];
        var optimisticTodo = {};
        optimisticTodo._id = null;
        optimisticTodo.title = todo.title;
        optimisticTodo.completed = false;
        //optimistically set the state
        data.push(optimisticTodo);
        this.setState({data: data});
        //submit the new data (handling changing the state on error)

        //get the new data
    },
    getInitialState: function () {
        return {data: []};
    },
    componentDidMount: function () {
        this.loadTodosFromServer();
        setInterval(this.loadTodosFromServer, this.props.pollInterval);
    },
    render: function () {
        return (
            <div className="todoBox">
                <TodoForm onTaskSubmit={this.handleTodoSubmit}/>
                <TodoList data={this.state.data}/>
            </div>
        );
    }
});

ReactDOM.render(
    <TodoBox url="/todo" pollInterval={2000}/>,
    document.getElementById('contentWidget')
);