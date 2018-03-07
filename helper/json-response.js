const responseSuccess = {
  "apiVersion": "0.1",
  "data": {
    "user": {
      "id": "0000-0001"
    },
    "token": ""
  }
};

const responseUsersSuccess = {
  "apiVersion": "0.1",
  "data": {
    "kind": "user",
    "totalItems": 100,
    "startIndex": 1,
    "itemsPerpage": 20,
    "currentItemCount": 20,
    "items": [
      {
        "id": "0000-0001",
        "username": "tony",
        "email": "tony@abc.com",
      },
      {
        "id": "0000-0002",
        "username": "kim",
        "email": "kim@abc.com",
      }
    ]
  }
}

const response404Error = {
  "apiVersion": "0.1",
  "error": {
    "code": 404,
    "message": "Not Found",
    "errors" :[{
      "domain": "user"
      "reason": "userNotFoundException",
      "message": "User Not Found"
    }]
  }
};

const reponse = (data) => ({
  "apiVersion": "0.1",
  data
});

export reponse;
