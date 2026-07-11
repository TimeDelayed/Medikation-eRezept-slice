export const handleNewMedication = (req, res) => {
  // console.log(req.params)
  // console.log(req.query)
  // console.log(req.body.medication)

  // console.log(req.user)
  // if (req.user?.claims?.includes('medication:create')) {
  //   return res.status(401)
  // }

  res.status(201).json({ result: 'ok' })
}
